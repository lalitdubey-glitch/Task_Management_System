using System.Net;
using System.Net.Mail;
using System.Security;

namespace Task_Management_System.Models
{
    public class EmailService
    {
        private readonly IConfiguration config;
        public EmailService(IConfiguration _config)
        {
            config = _config;
        }

        public void SendEmail(string email, string subject, string body)
        { 
                string adminEmail = config["EmailAddress:AdminEmail"]?.ToString();
                string adminPass = config["EmailAddress:AdminPass"]?.ToString();

                SmtpClient smtp = new SmtpClient()
                {
                    Host = "smtp.gmail.com",
                    Port = 587,
                    EnableSsl = true,
                    Credentials = new NetworkCredential(adminEmail, adminPass)
                };

                MailMessage mailMessage = new MailMessage()
                {
                    From = new MailAddress(adminEmail , "Lalit Dubey"),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(email);
                smtp.Send(mailMessage);
            
        }
    }
}
