using BCrypt;
using BCrypt.Net;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using System.Data;
using System.Diagnostics;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Task_Management_System.Models;

namespace Task_Management_System.Controllers
{
    public class HomeController : Controller
    {
        DBLayer db;
        private readonly EmailService emailService;
        public HomeController(DBLayer _db, EmailService _emailService)
        {
            db = _db;
            emailService = _emailService;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult SignUp()
        {
            return View();
        }

        [HttpPost]
        public IActionResult SignUp(SignUpModel s)
        {
            string hashPass = null;
            if (s.pass != null)
            {
                hashPass = BCrypt.Net.BCrypt.HashPassword(s.pass);
            }

            string[] allowRoles = { "manager", "hr", "employee" };
            if (!allowRoles.Contains(s.role))
            {
                return View();
            }

            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

            db.ExecuteQuery("sp_Users", new SqlParameter[]
            {
                new SqlParameter("@action" , "add"),
                new SqlParameter("@name" , s.name),
                new SqlParameter("@email" , s.email),
                new SqlParameter("@pass" , hashPass),
                new SqlParameter("@role" , s.role),
                msg
            });

            string ms = msg.Value.ToString();

            if (ms == "success")
            {
                return Json(new { success = ms });
            }
            else if (ms == "Email Already Exists")
            {
                return Json(new { success = ms });
            }
            else
            {
                return View();
            }
        }

        [HttpPost]
        public ActionResult EditUser(SignUpModel s)
        {

            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

            db.ExecuteQuery("sp_Users", new SqlParameter[]
            {
                new SqlParameter("@action" , "edit"),
                new SqlParameter("@userId" , s.id),
                new SqlParameter("@name" , s.name ),
                new SqlParameter("@role" ,s.role ),
                msg
            });

            string ms = msg.Value.ToString();

            if (ms == "success")
            {
                return Json(new { success = true });
            }
            else
            {
                return RedirectToAction("index");
            }
        }

        public ActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public async Task<ActionResult> Login(LoginModel l)
        {
            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

            DataTable dt = db.table("sp_Users", new SqlParameter[]
            {
                new SqlParameter("@action" , "selectOne"),
                new SqlParameter("@email" ,l.email),
                msg
            });

            string ms = msg.Value.ToString();

            bool hashPass = false;
            string roles = null;

            if(dt.Rows.Count > 0)
            {
                roles = dt.Rows[0]["role"].ToString();
                string pass = dt.Rows[0]["pass"].ToString();
                if (l.pass != null)
                {
                    hashPass = BCrypt.Net.BCrypt.Verify(l.pass, pass);
                }
            }

            if(hashPass)
            {
                var claims = new List<Claim>
                {
                    new Claim("userId" , dt.Rows[0]["userId"].ToString()),
                    new Claim("name" , dt.Rows[0]["name"].ToString()),
                    new Claim("email" , dt.Rows[0]["email"].ToString()),
                    new Claim(ClaimTypes.Role , roles)
                };

                var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                await HttpContext.SignInAsync(new ClaimsPrincipal(identity));

                if (ms == "success")
                {
                    return Json(new { success = ms , userName = dt.Rows[0]["name"] , userRole = roles });
                }
            }
            return View();
        }

        public ActionResult UserDashboard()
        {
            return View();
        }

        public ActionResult GetComments(int? id)
        {

            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

            DataTable res = db.table("sp_TaskComments", new SqlParameter[]
             {
                new SqlParameter("@action" , "selectByTask"),
                new SqlParameter("@taskId" , id),
                msg
             });

            string ms = msg.Value.ToString();

            if (ms == "success")
            {
                return Content(JsonConvert.SerializeObject(res), "application/json");
            }

            return View("Index");
        }

        [HttpPost]
        public ActionResult SendComment(string? cmt, int? id, string UserEmail,string ProjectName, string TaskName)
        {

            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

            db.ExecuteQuery("sp_TaskComments", new SqlParameter[]
            {
                new SqlParameter("@action" , "add"),
                new SqlParameter("@comment" , cmt),
                new SqlParameter("@taskId" , id),
                new SqlParameter("@commentedBy" , User.FindFirst("userId")?.Value),
                msg
            });

            emailService.SendEmail
                (
                UserEmail,
                "You have a Comment",
                "<p><strong>Project Name : </strong>" + ProjectName +"</p>"+ "<p><strong>Task Name : </strong>" + TaskName +"</p>" + "<h2>"+cmt+"</h2>"

                );

            string ms = msg.Value.ToString();

            if (ms == "success")
            {
                return Json(new { success = true });
            }

            return View("Index");
        }

        [HttpPost]
        public ActionResult DeleteComment(int? id)
        {

            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

            db.ExecuteQuery("sp_TaskComments", new SqlParameter[]
            {
                new SqlParameter("@action" , "delete"), 
                new SqlParameter("@commentId" , id), 
                msg
            });

            string ms = msg.Value.ToString();

            if (ms == "success")
            {
                return Json(new { success = true });
            }

            return View("Index");
        }

        public async Task<ActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Login");
         
        }

    }
}
