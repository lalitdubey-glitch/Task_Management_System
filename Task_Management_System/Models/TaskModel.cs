namespace Task_Management_System.Models
{
    public class TaskModel
    {
       public int taskId { get; set; }
       public int projectId { get; set; }
       public int AssignedTo { get; set; }
        public string? task { get; set; }
        public string? email { get; set; }
        public string? Description { get; set; }
        public string? status { get; set; }
        public string? priority { get; set; }
        public DateTime? DueDate { get; set; }
    }
}
