namespace Task_Management_System.Services
{
    public interface IEmailService
    {
        Task<bool> SendEmail(string email, string subject, string body);
    }
}