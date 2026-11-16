using System.ComponentModel.DataAnnotations;

namespace Task_Management_System.Models
{
    public class ProjectModel
    {
        public int projectID { get; set; }

        [Required]
        public string? projectName { get; set; }

        [Required]
        public string? Description { get; set; }

        [Required]
        public string? createdBy { get; set; }
    }
}
