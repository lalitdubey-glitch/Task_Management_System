namespace Task_Management_System.Models
{
    public interface IEmailService
    {
        Task<bool> SendEmail(string email, string subject, string body);
    }
}