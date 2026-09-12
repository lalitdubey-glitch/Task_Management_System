using System.Net;
using System.Net.Mail;
using System.Security;

namespace Task_Management_System.Models
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration config;     
        public EmailService(IConfiguration _config)
        {
            config = _config;   // ye appsetting.json ki sabhi key and value ko uthata h ager ye string type ka hota or construtor me IConfiguration use hua hota tb ye specific ek chij ko uthata like only ConnetionString --Like DBLayer (iska datatype bhi IConfiguration hona chahiye na ki string Type)
        }

        public async Task<bool> SendEmail(string email, string subject, string body)
        {
            string? adminEmail = config["EmailAddress:AdminEmail"];
            string? adminPass = config["EmailAddress:AdminPass"];

            if(string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPass))
            {
                return false;
            }

            try
            {
                using var smtp = new SmtpClient()
                {
                    Host = "smtp.gmail.com",
                    Port = 587,
                    EnableSsl = true,
                    Credentials = new NetworkCredential(adminEmail, adminPass)
                };

                using var mailMessage = new MailMessage()
                {
                    From = new MailAddress(adminEmail, "Lalit Dubey"),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(email);
                await smtp.SendMailAsync(mailMessage);

                return true;
            }
            catch (Exception)
            {
                return false;
            }

        }
    }
}
