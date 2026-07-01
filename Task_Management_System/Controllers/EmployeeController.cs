using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data;
using Microsoft.Data.Sql;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using System.Data;
using System.Net.Mail;
using Task_Management_System.Models;


namespace Task_Management_System.Controllers
{

    [Authorize(Roles = "employee,hr,manager")]
    public class EmployeeController : Controller
    {
        DBLayer db;
        private readonly EmailService emailService;
        public EmployeeController(DBLayer _db , EmailService _emailService)
        {
            db = _db;
            emailService = _emailService;
        }

        public IActionResult Index()
        {
            string email = User.FindFirst("email")?.Value;

            DataTable dt =   db.table("sp_Users", new SqlParameter[]
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

        public ActionResult selectByMember()
        {

            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

            DataTable res = db.table("sp_Task", new SqlParameter[]
             {
                new SqlParameter("@action" , "selectByMember"),
                new SqlParameter("@AssignedTo" , User.FindFirst("userId")?.Value),
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
        public ActionResult ChangeStatus(string? status , int? id)
        {

            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

             db.ExecuteQuery("sp_Task", new SqlParameter[]
             {
                new SqlParameter("@action" , "updateStatus"),
                new SqlParameter("@status" , status),
                new SqlParameter("@taskId" , id),
                msg
             });

            string ms = msg.Value.ToString();

            if (ms == "success")
            {
                return Json(new { success = true });
            }

            return View("Index");
        }

        [HttpPost]
        public ActionResult ResetPass(string pass)
        {
            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

            string HashPass = BCrypt.Net.BCrypt.HashPassword(pass);

            db.ExecuteQuery("sp_Users", new SqlParameter[]
            {
                new SqlParameter("@action", "resetPass"),
                new SqlParameter("@pass", HashPass),
                new SqlParameter("@userId", User.FindFirst("userId")?.Value),
                new SqlParameter("@email", User.FindFirst("email")?.Value),
                msg
            });

            string ms = msg.Value.ToString();
             
            if (ms == "success")
            {
                return Json(new { success = true });
            }
            else
            {
                return Json(new { success = false });
            }
             
        }

        public ActionResult SendOTP()
        {
            try
            {
                Random random = new Random();
                string otp = random.Next(111111, 999999).ToString();

                HttpContext.Session.SetString("otp", otp);

                emailService.SendEmail
                (
                    User.FindFirst("email")?.Value,
                    "Your OTP is : " + otp,
                    "<p>Fill this otp and verify yourself</p>"

                );


                return Json(new { success = true });
            }
            catch(Exception ex)
            {
                return Json(new { success = ex.Message });
            }
           
        }

        public ActionResult VerifyOTP(string UserOTP)
        {
            string sessionOtp = HttpContext.Session.GetString("otp")?.ToString();

            if (UserOTP == sessionOtp)
            {
                return Json(new { success = true });
            }
            else
            {
                return Json(new { success = false });
            } 
        }

       
    }

}
