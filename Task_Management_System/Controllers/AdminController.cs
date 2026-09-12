using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using System.Data;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Xml.Linq;
using Task_Management_System.Models;

namespace Task_Management_System.Controllers
{
    [Authorize(Roles ="admin")]
    public class AdminController : Controller
    {
        private readonly IDBLayer db;
        private readonly IEmailService _emailService;
        public AdminController(IDBLayer _db, IEmailService EmailService)
        {
            db = _db;
            _emailService = EmailService;
        }
        public async Task<IActionResult> Index()
        {

            DataTable totals = await db.TableAsync("sp_Users", new SqlParameter[]
            {
                new SqlParameter("@action" , "totalCounts")
            });

            ViewBag.totalProject = totals.Rows[0]["totalProject"].ToString();
            ViewBag.totalTask = totals.Rows[0]["totalTask"].ToString();
            ViewBag.totalUser = totals.Rows[0]["totalUser"].ToString();
            ViewBag.LoginUser = User.FindFirst("name")?.Value;

            return View();
        }

        public async Task<ActionResult> GetUser()
        { 

            DataTable dt =await db.TableAsync("sp_Users", new SqlParameter[]
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

        public async Task<ActionResult> GetProject()
        { 

            DataTable dt =await db.TableAsync("sp_Projects", new SqlParameter[]
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

        public async Task<ActionResult> selectByProjectId(int? id)
        { 

            DataTable dt =await db.TableAsync("sp_Task", new SqlParameter[]
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
        public async Task<ActionResult> DeleteProject(int? id)
        {
            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

           await db.ExecuteQueryAsync("sp_Projects", new SqlParameter[]
            {
                new SqlParameter("@action" , "delete"),
                new SqlParameter("@projectID" , id),
                msg
            });

            string? ms = msg.Value?.ToString()??"";

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
        public async Task<IActionResult> DeleteUser(int? id)
        {
            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

           await db.ExecuteQueryAsync("sp_Users", new SqlParameter[]
            {
                new SqlParameter("@action" , "delete"),
                new SqlParameter("@userId" , id),
                msg
            });

            string? ms = msg.Value?.ToString()??"";

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
        public async Task<ActionResult> Project(ProjectModel p)
        {
            string action = p.projectID > 0 ? "edit" : "add";

            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

           await db.ExecuteQueryAsync("sp_Projects", new SqlParameter[]
            {
                new SqlParameter("@action" , action),
                new SqlParameter("@projectID" , p.projectID!=0?p.projectID:(object)DBNull.Value),
                new SqlParameter("@projectName" , p.projectName),
                new SqlParameter("@Description" , p.Description),
                new SqlParameter("@createdBy" , User.FindFirst("userId")?.Value),
                msg

            });

            string? ms = msg.Value?.ToString()??"";

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
        public async Task<ActionResult> Task(TaskModel t)
        {
            string action = t.taskId > 0 ? "edit" : "add";

            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

            int res = await db.ExecuteQueryAsync("sp_Task", new SqlParameter[]
            {
                new SqlParameter("@action", action),
                new SqlParameter("@taskId", t.taskId > 0 ? t.taskId : (object)DBNull.Value),
                new SqlParameter("@task", t.task ?? (object)DBNull.Value),
                new SqlParameter("@DueDate", t.DueDate ?? (object)DBNull.Value),
                new SqlParameter("@priority", t.priority ?? (object)DBNull.Value),
                new SqlParameter("@status", t.status ?? (object)DBNull.Value),
                new SqlParameter("@Description", t.Description ?? (object)DBNull.Value),
                new SqlParameter("@AssignedTo", t.AssignedTo),
                new SqlParameter("@projectId", t.projectId),
                msg
            });

            string ms = msg.Value?.ToString() ?? "";

            if (ms == "success")
            { 
                string emailBody = $@"
                <div>
                    <h3>Your Task is: {t.task}</h3>
                    <p><strong>Task Description:</strong> {t.Description}</p>
                    <p style='color: red;'><strong>Due Date:</strong> {t.DueDate}</p>
                </div>";
                 
                await _emailService.SendEmail(
                    t.email,
                    "You have a Task",
                    emailBody
                );

                return Json(new { success = true });
            }
             
            return Json(new { success = false, message = ms });
        }

        [HttpPost]
        public async Task<ActionResult> TaskDelete(int? id)
        {
             
            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

           int res = await db.ExecuteQueryAsync("sp_Task", new SqlParameter[]
            {
                new SqlParameter("@action" , "delete"),
                new SqlParameter("@taskId" , id),
                msg
            });

            string? ms = msg.Value?.ToString()??"";

            if (ms == "success")
            {
                return Json(new { success = true });
            }
            return View();
          
        }

        public async Task<ActionResult> GetTaskById(int? id)
        {
             
            SqlParameter msg = new SqlParameter("@msg", SqlDbType.NVarChar, 255)
            {
                Direction = ParameterDirection.Output
            };

           DataTable res =await db.TableAsync("sp_Task", new SqlParameter[]
            {
                new SqlParameter("@action" , "selectOne"),
                new SqlParameter("@taskId" , id),
                msg
            });

            string? ms = msg.Value?.ToString()??"";

            if (ms == "success")
            {
                return Content(JsonConvert.SerializeObject(res), "application/json");
            }

            return View("Task");
        }

       

        public async Task<ActionResult> GetTask()
        {

            DataTable dt =await db.TableAsync("sp_Task", new SqlParameter[]
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
