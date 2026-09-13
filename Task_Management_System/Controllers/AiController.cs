using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using System.Data;
using System.Text.Json;
using System.Text.Json.Serialization;
using Task_Management_System.Models;

namespace Task_Management_System.Controllers
{
    public class AiController : Controller
    {
        private readonly IGroqAIServices _aiServices;
        private readonly IDBLayer _db;

        public AiController(IGroqAIServices aiServices, IDBLayer db )
        {
            _aiServices = aiServices;
            _db = db;
        }

        [HttpPost]
        public async Task<IActionResult> PolishComment(string cmt)
        {
            if (string.IsNullOrWhiteSpace(cmt))
            {
                return Json(new { success = false, message = "Comment can not be Blank!" });
            }

            try
            {
                string systemPrompt = "You are an expert technical editor. Rewrite the given task comment into a concise, professional engineering status update. Do not add any conversational remarks, intros, or quotes. Output ONLY the polished comment.";

                string polishedResult = await _aiServices.GetCompletionAsync(systemPrompt, cmt);

                return Json(new { success = true, data = polishedResult });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> GenerateSubtasks(string taskTitle, string taskDescription)
        {
            if (string.IsNullOrWhiteSpace(taskTitle))
            {
                return Json(new { success = false, message = "Task Title required hai!" });
            }

            try
            { 
                string systemPrompt = @"You are a senior full-stack .NET architect guiding a junior developer.
                        The project architecture strictly uses:
                        - Backend: ASP.NET Core MVC with C#
                        - Database: Microsoft SQL Server (MSSQL) using custom async DBLayer / Stored Procedures / ADO.NET
                        - Frontend: Razor Views (.cshtml), Bootstrap 5, and jQuery AJAX with SweetAlert2

                        Your goal: Break down the assigned task into 3 to 5 realistic, sequential, technical implementation steps strictly following this stack (e.g., mention SQL query/SP, Controller Action, jQuery AJAX call, and Razor UI update where applicable).

                        Rules:
                        1. Steps must be specific to .NET Core and the described task.
                        2. Output ONLY a raw JSON array of strings.
                        3. No markdown ticks, no conversational text.
                        Example format:
                        [""Create stored procedure or SQL query in MSSQL for fetching user records"", ""Add async data method in DBLayer to execute SP"", ""Create Controller action returning Json result"", ""Write jQuery AJAX call on button click to render data in table""]";

                string userPrompt = $"Assigned Task Title: {taskTitle}\nDetails/Scope: {taskDescription}";

                string aiResponse = await _aiServices.GetCompletionAsync(systemPrompt, userPrompt);

                string cleanJson = aiResponse.Replace("```json", "").Replace("```", "").Trim();

                return Json(new { success = true, data = cleanJson });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GenerateProjectSummary(int projectId)
        {
            if (projectId <= 0)
            {
                return Json(new { success = false, message = "Valid Project ID required hai!" });
            }

            try
            { 
                DataTable dtTasks = await _db.TableAsync("sp_Task", new SqlParameter[]
                {
                    new SqlParameter("@action", "selectByProjectForAI"),
                    new SqlParameter("@projectId", projectId),
                    new SqlParameter("@Msg", SqlDbType.VarChar, 255) { Direction = ParameterDirection.Output }
                });

                if (dtTasks == null || dtTasks.Rows.Count == 0)
                {
                    return Json(new { success = false, message = "There is no Task in this Project" });
                }
                 
                var taskList = dtTasks.AsEnumerable().Select(row => new
                {
                    Task = row["task"]?.ToString(),
                    Description = row["Description"]?.ToString(),
                    Priority = row["priority"]?.ToString(),
                    Status = row["status"]?.ToString(),
                    DueDate = row["DueDate"] != DBNull.Value ? Convert.ToDateTime(row["DueDate"]).ToString("yyyy-MM-dd") : "Not Set",
                    AssignedTo = row["userName"]?.ToString() ?? "",
                    Comments = row["recentComments"]?.ToString() ?? "No comments"
                }).ToList();

                string rawContext = System.Text.Json.JsonSerializer.Serialize(taskList);

                string systemPrompt = @"You are an executive project manager.
                    Analyze the provided JSON list of project tasks and their latest comments.
                    Provide a crisp status report strictly using these 3 sections formatted with HTML bold tags:
                    <b>Overall Health:</b> (1 sentence evaluating completion and timeline status)
                    <br/> <b>Bottlenecks & Risks:</b> (1-2 sentences identifying delayed, blocked, or high-priority items based on comments/status)
                    <br/> <b>Next Actions:</b> (2 bullet points recommending immediate steps)";

                string userPrompt = $"Project Tasks with Context:\n{rawContext}";

                string summaryHtml = await _aiServices.GetCompletionAsync(systemPrompt, userPrompt);

                return Json(new { success = true, data = summaryHtml });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AskProjectCopilot(int projectId, string userQuestion)
        {
            if (projectId <= 0 || string.IsNullOrWhiteSpace(userQuestion))
            {
                return Json(new { success = false, message = "Valid Project ID aur Question required hai!" });
            }

            try
            { 
                DataTable dtTasks = await _db.TableAsync("sp_Task", new SqlParameter[]
                {
                    new SqlParameter("@action", "selectByProjectForAI"),
                    new SqlParameter("@projectId", projectId),
                    new SqlParameter("@Msg", SqlDbType.VarChar, 255) { Direction = ParameterDirection.Output }
                });

                if (dtTasks == null || dtTasks.Rows.Count == 0)
                {
                    return Json(new { success = false, message = "Is project me koi task exist nahi karta!" });
                }
                 
                var taskList = dtTasks.AsEnumerable().Select(row => new
                {
                    TaskId = Convert.ToInt32(row["taskId"]),
                    Task = row["task"]?.ToString(),
                    Description = row["Description"]?.ToString(),
                    Priority = row["priority"]?.ToString(),
                    Status = row["status"]?.ToString(),
                    DueDate = row["DueDate"] != DBNull.Value ? Convert.ToDateTime(row["DueDate"]).ToString("yyyy-MM-dd") : "Not Set",
                    AssignedTo = row["userName"]?.ToString() ?? "",
                    Comments = row["recentComments"]?.ToString() ?? "No comments"
                }).ToList();

                string rawContext = System.Text.Json.JsonSerializer.Serialize(taskList);

                string systemPrompt = @"You are an intelligent project assistant copilot.
                    Analyze the provided JSON tasks data (including task names, status, priorities, assignees, deadlines, and recent comments).
                    Answer the user's question directly, accurately, and concisely based ONLY on this context.
                    Use clean HTML formatting (<b>, <ul>, <li>, <br/>) for readability. Do not hallucinate or guess details.";

                string userPrompt = $"Project Tasks with Context:\n{rawContext}\n\nUser Question:\n{userQuestion}";

                string answerHtml = await _aiServices.GetCompletionAsync(systemPrompt, userPrompt);

                return Json(new { success = true, data = answerHtml });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AskMyTasksCopilot(string userQuestion)
        {
            if (string.IsNullOrWhiteSpace(userQuestion))
            {
                return Json(new { success = false, message = "Question cannot be empty!" });
            }

            try
            {
                var claimUserId = User.FindFirst("userId")?.Value;

                if (string.IsNullOrEmpty(claimUserId) || !int.TryParse(claimUserId, out int loggedUserId))
                {
                    return Json(new { success = false, message = "User session expired. Please login again!" });
                }
                 
                DataTable dtTasks = await _db.TableAsync("sp_Task", new SqlParameter[]
                {
                    new SqlParameter("@action", "selectByMemberForAI"),
                    new SqlParameter("@AssignedTo", loggedUserId),
                    new SqlParameter("@Msg", SqlDbType.VarChar, 255) { Direction = ParameterDirection.Output }
                });

                if (dtTasks == null || dtTasks.Rows.Count == 0)
                {
                    return Json(new { success = false, message = "Aapke paas filhal koi assigned tasks nahi hain!" });
                }
                 
                var taskList = dtTasks.AsEnumerable().Select(row => new
                {
                    Task = row["task"]?.ToString(),
                    Project = row["ProjectName"]?.ToString() ?? "General",
                    Description = row["Description"]?.ToString(),
                    Priority = row["priority"]?.ToString(),
                    Status = row["status"]?.ToString(),
                    DueDate = row["DueDate"] != DBNull.Value ? Convert.ToDateTime(row["DueDate"]).ToString("yyyy-MM-dd") : "Not Set",
                    Comments = row["recentComments"]?.ToString() ?? "No comments"
                }).ToList();



                string rawContext = System.Text.Json.JsonSerializer.Serialize(taskList);

                string systemPrompt = @"You are a direct, personal task assistant for this team member.
                    Analyze their assigned tasks JSON data (task names, projects, priorities, status, deadlines, and recent comments).
                    Answer the user's question clearly and concisely.
                    Rules:
                    1. Address the user directly ('Your task...', 'You have...').
                    2. Prioritize high-priority and urgent deadlines first.
                    3. Keep answers within 2-4 sentences using simple HTML (<b>, <ul>, <li>).";

                string userPrompt = $"Assigned Tasks Data:\n{rawContext}\n\nUser Question:\n{userQuestion}";

                string answerHtml = await _aiServices.GetCompletionAsync(systemPrompt, userPrompt);

                return Json(new { success = true, data = answerHtml });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
         
    }
}
