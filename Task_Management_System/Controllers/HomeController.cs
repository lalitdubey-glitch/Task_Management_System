using EmailValidation;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Diagnostics;
using System.Security.Claims;
using Task_Management_System.Models;
using Task_Management_System.Services;

namespace Task_Management_System.Controllers
{
    public class HomeController : Controller
    {
        private readonly IDBLayer db;
        private readonly IEmailService emailService;
        private readonly ILogger<HomeController> _logger;
        public HomeController(IDBLayer _db, IEmailService _emailService, ILogger<HomeController> logger)
        {
            db = _db;
            emailService = _emailService;
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult AccessDeniedPage()
        {
            return View();
        }

        public IActionResult SignUp()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> SignUp(SignUpModel s)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return Json(new { success = false, ms = "pleaseFillMandatoryFields" });
                }

                if (!string.IsNullOrWhiteSpace(s.email))
                {
                    var isValid = EmailValidator.Validate(s.email);
                    if (!isValid)
                    {
                        return Json(new { success = false, ms = "invalidEmail" });
                    }

                }

                string? hashPass = null;

                if (!string.IsNullOrWhiteSpace(s.pass))
                {
                    hashPass = BCrypt.Net.BCrypt.HashPassword(s.pass);
                }

                string[] allowRoles = { "manager", "hr", "employee" };

                if (!allowRoles.Contains(s.role))
                {
                    return Json(new { success = false, ms = "invalidRole" });
                }

                SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
                {
                    Direction = ParameterDirection.Output
                };

                await db.ExecuteQueryAsync("sp_Users", new SqlParameter[]
                {
                    new SqlParameter("@action" , "add"),
                    new SqlParameter("@name" , s.name),
                    new SqlParameter("@email" , s.email),
                    new SqlParameter("@pass" , hashPass),
                    new SqlParameter("@role" , s.role),
                    msg
                });

                string? ms = msg.Value?.ToString() ?? "";

                if (ms == "success")
                {
                    return Json(new { success = true, ms = ms });
                }
                else if (ms == "Email Already Exists")
                {
                    return Json(new { success = false, ms = "userAlreadyExists" });
                }

                return Json(new { success = false });
            }
            catch (Exception ex)
            {
                Response.StatusCode = 500;
                return Json(new { success = false, ms = ex.Message });
            }

        }

        [HttpPost]
        public async Task<ActionResult> EditUser(SignUpModel s)
        {

            try
            {
                SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
                {
                    Direction = ParameterDirection.Output
                };

                await db.ExecuteQueryAsync("sp_Users", new SqlParameter[]
                {
                    new SqlParameter("@action" , "edit"),
                    new SqlParameter("@userId" , s.id),
                    new SqlParameter("@name" , s.name ),
                    new SqlParameter("@role" ,s.role ),
                    msg
                });

                string? ms = msg.Value?.ToString() ?? "";

                if (ms == "success")
                {
                    return Json(new { success = true, ms = ms });
                }
                return Json(new { success = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database Error");
                Response.StatusCode = 500;
                return Json(new { success = false });
            }
        }

        public ActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public async Task<ActionResult> Login(LoginModel l)
        {
            try
            {
                SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
                {
                    Direction = ParameterDirection.Output
                };

                DataTable dt = await db.TableAsync("sp_Users", new SqlParameter[]
                {
                    new SqlParameter("@action" , "selectOne"),
                    new SqlParameter("@email" ,l.email),
                    msg
                });

                string? ms = msg.Value?.ToString() ?? "";

                bool hashPass = false;
                string? roles = null;

                if (dt.Rows.Count > 0)
                {
                    roles = dt.Rows[0]["role"].ToString()!;
                    string pass = dt.Rows[0]["pass"].ToString()!;
                    if (l.pass != null)
                    {
                        hashPass = BCrypt.Net.BCrypt.Verify(l.pass, pass);
                    }
                }

                if (hashPass)
                {
                    if (ms == "success")
                    {
                        var prop = new AuthenticationProperties
                        {
                            IsPersistent = l.remember,
                            ExpiresUtc = l.remember ? DateTimeOffset.UtcNow.AddDays(7) : null,
                        };

                        var claims = new List<Claim>
                        {
                            new Claim("userId" , dt.Rows[0]["userId"].ToString()!),
                            new Claim("name" , dt.Rows[0]["name"].ToString()!),
                            new Claim("email" , dt.Rows[0]["email"].ToString()!),
                            new Claim(ClaimTypes.Role , roles!)
                        };

                        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                        await HttpContext.SignInAsync(new ClaimsPrincipal(identity), prop);

                        //string url = roles == "admin" ? Url.Action("Index", "Admin")! : Url.Action("Index", "Employee")!;
                         
                        string url = roles?.ToLower() switch
                        {
                            "admin" => Url.Action("Index", "Admin")!, 
                            "employee" => Url.Action("Index", "Employee")!,
                            "hr" => Url.Action("index" , "Employee")!,
                            "manager" => Url.Action("index" , "Employee")!,
                            _ => Url.Action("Login", "Home")!    //fallback
                        };

                        return Json(new { success = true, ms = ms, userName = dt.Rows[0]["name"], userRole = roles, url = url });
                    }
                }
                return Json(new { success = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database Error");
                Response.StatusCode = 500;
                return Json(new { success = false });
            }
        }

        public ActionResult UserDashboard()
        {
            return View();
        }

        public async Task<ActionResult> GetComments(int? id)
        {
            try
            {
                SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
                {
                    Direction = ParameterDirection.Output
                };

                DataTable dt = await db.TableAsync("sp_TaskComments", new SqlParameter[]
                 {
                    new SqlParameter("@action" , "selectByTask"),
                    new SqlParameter("@taskId" , id),
                    msg
                 });

                string? ms = msg.Value?.ToString() ?? "";

                if (dt.Rows.Count > 0 && ms == "success")
                {
                    return Json(new { success = true, data = dt });
                }

                return Json(new { success = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database Error");
                Response.StatusCode = 500;
                return Json(new { success = false });
            }

        }

        [HttpPost]
        public async Task<ActionResult> SendComment(string? cmt, int? id, string UserEmail, string ProjectName, string TaskName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(cmt))
                {
                    return Json(new { success = false });
                }

                SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
                {
                    Direction = ParameterDirection.Output
                };

                await db.ExecuteQueryAsync("sp_TaskComments", new SqlParameter[]
                {
                    new SqlParameter("@action", "add"),
                    new SqlParameter("@comment", cmt ?? (object)DBNull.Value),
                    new SqlParameter("@taskId", id ?? (object)DBNull.Value),
                    new SqlParameter("@commentedBy", User.FindFirst("userId")?.Value ?? (object)DBNull.Value),
                    msg
                });

                string ms = msg.Value?.ToString() ?? "";

                if (ms == "success")
                {
                    return Json(new { success = true });
                }

                return Json(new { success = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database Error");
                Response.StatusCode = 500;
                return Json(new { success = false });
            }

        }

        [HttpPost]
        public async Task<ActionResult> DeleteComment(int? id)
        {
            try
            {
                SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
                {
                    Direction = ParameterDirection.Output
                };

                await db.ExecuteQueryAsync("sp_TaskComments", new SqlParameter[]
                {
                    new SqlParameter("@action" , "delete"),
                    new SqlParameter("@commentId" , id),
                    msg
                });

                string ms = msg.Value?.ToString() ?? "";

                if (ms == "success")
                {
                    return Json(new { success = true });
                }

                return Json(new { success = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database Error");
                Response.StatusCode = 500;
                return Json(new { success = false });
            }

        }

        public async Task<ActionResult> Logout()
        {
            try
            {
                await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return RedirectToAction("Login");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database Error");
                return RedirectToAction("Login");
            }

        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel
            {
                RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier
            });
        }

        public async Task<ActionResult> selectAllCommentsByLoggedInUser()
        {
            try
            {
                int userId = Convert.ToInt32(User.FindFirst("userId")?.Value ?? "0");

                DataTable dt = await db.TableAsync("sp_TaskComments", new SqlParameter[]
                 {
                    new SqlParameter("@action" , "selectAllTaskByUser"),
                    new SqlParameter("@LoggedInUserId" , userId)
                 });

                if (dt.Rows.Count > 0)
                {
                    return Json(new { success = true, data = dt });
                }
                return Json(new { success = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database Error");
                Response.StatusCode = 500;
                return Json(new { success = false });
            }

        }

    }
}
