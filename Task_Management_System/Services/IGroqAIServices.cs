namespace Task_Management_System.Services
{
    public interface IGroqAIServices
    {
        Task<string> GetCompletionAsync(string systemPrompt, string userPrompt);
    }
}