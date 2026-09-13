using System.ComponentModel.DataAnnotations;

namespace Task_Management_System.Models
{
    public class SignUpModel
    {
        public int id { get; set; }
        public string? name { get; set; }

        [EmailAddress]
        public string? email { get; set; }
        public string? pass { get; set; }
        public string? role { get; set; }
    }
}
