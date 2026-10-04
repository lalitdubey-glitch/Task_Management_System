using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.NewtonsoftJson;
using Microsoft.Data;
using Microsoft.Data.Sql;
using Microsoft.Data.SqlClient; 
using Newtonsoft.Json;
using System.Data;
using System.Net.Mail;
using System.Threading.Tasks;
using Task_Management_System.Models;


namespace Task_Management_System.Controllers
{

    [Authorize(Roles = "employee,hr,manager")]
    public class EmployeeController : Controller
    {
        private readonly IDBLayer db;
        private readonly IEmailService emailService;
        public EmployeeController(IDBLayer _db , IEmailService _emailService)
        {
            db = _db;
            emailService = _emailService;
        }

        public async Task<IActionResult> Index()
        {
            string? email = User.FindFirst("email")?.Value;

            DataTable dt =  await db.TableAsync("sp_Users", new SqlParameter[]
            {
                new SqlParameter("@action" , "selectOne"),
                new SqlParameter("@email" , email),
            });

            if(dt.Rows.Count > 0 )
            {
                return View(dt);
            }
            return View();
        }

        public async Task<IActionResult> GetLoggedInUserDetails()
        {
            try
            {
                string? email = User.FindFirst("email")?.Value;

                DataTable dt = await db.TableAsync("sp_Users", new SqlParameter[]
                {
                    new SqlParameter("@action" , "selectOne"),
                    new SqlParameter("@email" , email),
                });

                if (dt.Rows.Count > 0)
                {
                    return Json(new { success = true, data = dt });
                }
                return Json(new { success = false});
            }
            catch (Exception ex)
            {
                Response.StatusCode = 500;
                return Json(new { success = false, ms = ex.Message });
            }
            
             
        }

        public async Task<ActionResult> selectByMember()
        {
            try
            {
                SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
                {
                    Direction = ParameterDirection.Output
                };

                DataTable dt = await db.TableAsync("sp_Task", new SqlParameter[]
                 {
                    new SqlParameter("@action" , "selectByMember"),
                    new SqlParameter("@AssignedTo" , User.FindFirst("userId")?.Value),
                    msg
                 });

                string? ms = msg.Value?.ToString() ?? "";

                if (dt.Rows.Count>0 && ms == "success")
                {
                    return Json(new {success=true , data=dt});
                }

                return Json(new { success = false});
            }
            catch (Exception ex)
            {
                Response.StatusCode = 500;
                return Json(new { success = false, ms = ex.Message });
            }
            
             
        }

        [HttpPost]
        public async Task<ActionResult> ChangeStatus(string? status , int? id)
        {

            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

            await db.ExecuteQueryAsync("sp_Task", new SqlParameter[]
             {
                new SqlParameter("@action" , "updateStatus"),
                new SqlParameter("@status" , status),
                new SqlParameter("@taskId" , id),
                msg
             });

            string? ms = msg.Value?.ToString()??"";

            if (ms == "success")
            {
                return Json(new { success = true });
            }

            return View("Index");
        }

        [HttpPost]
        public async Task<ActionResult> ResetPass(string pass)
        {
            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

            string HashPass = BCrypt.Net.BCrypt.HashPassword(pass);

           await db.ExecuteQueryAsync("sp_Users", new SqlParameter[]
            {
                new SqlParameter("@action", "resetPass"),
                new SqlParameter("@pass", HashPass),
                new SqlParameter("@userId", User.FindFirst("userId")?.Value),
                new SqlParameter("@email", User.FindFirst("email")?.Value),
                msg
            });

            string? ms = msg.Value?.ToString()??"";
             
            if (ms == "success")
            {
                return Json(new { success = true });
            }
            else
            {
                return Json(new { success = false });
            }
             
        }

        [HttpPost]
        public async Task<ActionResult> SendOTP()
        {
            try
            { 
                string? userEmail = User.FindFirst("email")?.Value; 

                if (string.IsNullOrWhiteSpace(userEmail))
                {
                    return Json(new { success = false, message = "User email not found or user is not authenticated." });
                } 
                 
                Random random = new Random();
                string otp = random.Next(100000, 999999).ToString();
                 
                HttpContext.Session.SetString("otp", otp);
                HttpContext.Session.SetString("otp_expiry", DateTime.UtcNow.AddMinutes(5).ToString("o"));
                 
                string emailBody = $@"
                <div>
                    <h2>Your Verification Code</h2>
                    <p>{otp}</p>
                    <p>Fill this OTP to verify yourself. This code is valid for 5 minutes.</p>
                </div>";

                bool isSent = await emailService.SendEmail(userEmail,  "Your OTP Code", emailBody );

                if (!isSent)
                {
                    return Json(new { success = false, message = "Failed to send email. Please check SMTP settings." });
                }

                return Json(new { success = true, message = "OTP sent successfully." });
            }
            catch (Exception ex)
            {
                Response.StatusCode = 500;
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public ActionResult VerifyOTP(string? UserOTP)
        {
            if (string.IsNullOrWhiteSpace(UserOTP))
            {
                return Json(new { success = false, message = "Please enter OTP." });
            }

            string? sessionOtp = HttpContext.Session.GetString("otp");
            string? expiryStr = HttpContext.Session.GetString("otp_expiry");
            

            if (string.IsNullOrEmpty(sessionOtp) || string.IsNullOrEmpty(expiryStr))
            {
                return Json(new { success = false, message = "OTP not found. Request a new one." });
            }

            

            if (DateTime.UtcNow > DateTime.Parse(expiryStr).ToUniversalTime())
            {
                HttpContext.Session.Remove("otp");
                HttpContext.Session.Remove("otp_expiry");
                return Json(new { success = false, message = "OTP has expired. Request a new one." });
            }

            if (UserOTP.Trim() == sessionOtp)
            {
                HttpContext.Session.Remove("otp");
                HttpContext.Session.Remove("otp_expiry");  
                return Json(new { success = true, message = "OTP verified successfully!" });
            }

            //int attempts = HttpContext.Session.GetInt32("attempt") ?? 0;

            //if (UserOTP.Trim() != sessionOtp)
            //{
            //    attempts++;
            //    HttpContext.Session.SetInt32("attempt", attempts);
            //}


            //if (attempts >= 5)
            //{
            //    HttpContext.Session.Remove("otp");
            //    HttpContext.Session.Remove("otp_expiry");
            //    HttpContext.Session.Remove("attempt");
            //    return Json(new { success = false, message = "To Many Attempts!" });
            //}

            return Json(new { success = false, message = "Invalid OTP." });
        }

       


    }

}
