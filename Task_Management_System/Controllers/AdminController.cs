using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using System.Data;
using System.Text.Json.Serialization;
using System.Xml.Linq;
using Task_Management_System.Models;

namespace Task_Management_System.Controllers
{
    [Authorize(Roles ="admin")]
    public class AdminController : Controller
    {
        DBLayer db;
        private readonly EmailService EmailService;
        public AdminController(DBLayer _db, EmailService _EmailService)
        {
            db = _db;
            EmailService = _EmailService;
        }
        public IActionResult Index()
        {

            DataTable totals = db.table("sp_Users", new SqlParameter[]
            {
                new SqlParameter("@action" , "totalCounts")
            });

            ViewBag.totalProject = totals.Rows[0]["totalProject"].ToString();
            ViewBag.totalTask = totals.Rows[0]["totalTask"].ToString();
            ViewBag.totalUser = totals.Rows[0]["totalUser"].ToString();
            ViewBag.LoginUser = User.FindFirst("name")?.Value;

            return View();
        }

        public ActionResult GetUser()
        { 

            DataTable dt = db.table("sp_Users", new SqlParameter[]
            {
                new SqlParameter("@action" , "selectAll")
            });

            if (dt.Rows.Count > 0)
            {
                return Content(JsonConvert.SerializeObject(dt), "application/json");
            }
            else
            {
                return RedirectToAction("index");
            }
        }

        public ActionResult GetProject()
        { 

            DataTable dt = db.table("sp_Projects", new SqlParameter[]
            {
                new SqlParameter("@action" , "selectAll")
            });

            if (dt.Rows.Count > 0)
            {
                return Content(JsonConvert.SerializeObject(dt), "application/json");
            }
            else
            {
                return RedirectToAction("index");
            }
        }

        public ActionResult selectByProjectId(int? id)
        { 

            DataTable dt = db.table("sp_Task", new SqlParameter[]
            {
                new SqlParameter("@action" , "selectByProject"),
                new SqlParameter("@projectId" , id),

            });

            if (dt.Rows.Count > 0)
            {
                return Content(JsonConvert.SerializeObject(dt), "application/json");
            }
            else
            {
                return RedirectToAction("index");
            }
        }

        [HttpPost]
        public ActionResult DeleteProject(int? id)
        {
            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

            db.ExecuteQuery("sp_Projects", new SqlParameter[]
            {
                new SqlParameter("@action" , "delete"),
                new SqlParameter("@projectID" , id),
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

        [HttpPost]
        public IActionResult DeleteUser(int? id)
        {
            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

            db.ExecuteQuery("sp_Users", new SqlParameter[]
            {
                new SqlParameter("@action" , "delete"),
                new SqlParameter("@userId" , id),
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
         
        public ActionResult UserData()
        {
            return View();
        }
        public ActionResult Project()
        {
            ViewBag.createdBy = User.FindFirst("name")?.Value;
            return View();
        }

        [HttpPost]
        public ActionResult Project(ProjectModel p)
        {
            string action = p.projectID > 0 ? "edit" : "add";

            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

            db.ExecuteQuery("sp_Projects", new SqlParameter[]
            {
                new SqlParameter("@action" , action),
                new SqlParameter("@projectID" , p.projectID!=null?p.projectID:(object)DBNull.Value),
                new SqlParameter("@projectName" , p.projectName),
                new SqlParameter("@Description" , p.Description),
                new SqlParameter("@createdBy" , User.FindFirst("userId")?.Value),
                msg

            });

            string ms = msg.Value.ToString();

            if (ms == "success")
            {
                return Json(new { success = true });
            }
            return View();
        }
        public ActionResult Task()
        {
            return View();
        }

        [HttpPost]
        public ActionResult Task(TaskModel t)
        {
            string action = t.taskId > 0 ? "edit" : "add";

            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

           int res = db.ExecuteQuery("sp_Task", new SqlParameter[]
            {
                new SqlParameter("@action" , action),
                new SqlParameter("@taskId" , t.taskId > 0 ? t.taskId:(object)DBNull.Value),
                new SqlParameter("@task" , t.task),
                new SqlParameter("@DueDate" , t.DueDate),
                new SqlParameter("@priority" , t.priority),
                new SqlParameter("@status" , t.status),
                new SqlParameter("@Description" , t.Description),
                new SqlParameter("@AssignedTo" , t.AssignedTo),
                new SqlParameter("@projectId" , t.projectId),
                msg
            });

            string ms = msg.Value.ToString();

            if (ms == "success")
            {
                EmailService.SendEmail
                    (
                        t.email,
                        "You have a Task",
                        "<h3>Your Task is : " + t.task +"</h3>"+ "<p> <strong>Task Discription : </strong> " + t.Description +"</p>" + "<p style='color:red;'> <strong>Due Date : </strong> " + t.DueDate + "</p>"

                    );
                 
                return Json(new { success = true });
            }
            return View();
          
        }

        [HttpPost]
        public ActionResult TaskDelete(int? id)
        {
             
            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

           int res = db.ExecuteQuery("sp_Task", new SqlParameter[]
            {
                new SqlParameter("@action" , "delete"),
                new SqlParameter("@taskId" , id),
                msg
            });

            string ms = msg.Value.ToString();

            if (ms == "success")
            {
                return Json(new { success = true });
            }
            return View();
          
        }

        public ActionResult GetTaskById(int? id)
        {
             
            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

           DataTable res = db.table("sp_Task", new SqlParameter[]
            {
                new SqlParameter("@action" , "selectOne"),
                new SqlParameter("@taskId" , id),
                msg
            });

            string ms = msg.Value.ToString();

            if (ms == "success")
            {
                return Content(JsonConvert.SerializeObject(res), "application/json");
            }

            return View("Task");
        }

       

        public ActionResult GetTask()
        {

            DataTable dt = db.table("sp_Task", new SqlParameter[]
            {
                new SqlParameter("@action" , "selectAll")
            });

            if (dt.Rows.Count > 0)
            {
                return Content(JsonConvert.SerializeObject(dt), "application/json");
            }
            else
            {
                return RedirectToAction("index");
            }
        } 
    }
}
