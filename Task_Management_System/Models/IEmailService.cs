namespace Task_Management_System.Models
{
    public interface IEmailService
    {
        void SendEmail(string email, string subject, string body);
    }
}