
namespace Task_Management_System.Models
{
    public interface IGroqAIServices
    {
        Task<string> GetCompletionAsync(string systemPrompt, string userPrompt);
    }
}