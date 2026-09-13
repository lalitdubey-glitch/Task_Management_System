using System.Text;
using System.Text.Json;

namespace Task_Management_System.Models
{
    public class GroqAIServices : IGroqAIServices
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;

        public GroqAIServices(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _config = config;
        }

        public async Task<string> GetCompletionAsync(string systemPrompt, string userPrompt)
        {
            var apiKey = _config["Groq:ApiKey"];
            var endpoint = _config["Groq:BaseUrl"];
            var model = _config["Groq:Model"] ?? "openai/gpt-oss-120b";

            var payload = new
            {
                model = model,
                messages = new[]
                {
                    new {role = "system" , content = systemPrompt},
                    new {role = "user" , content = userPrompt},
                },
                temperature = 0.3
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            request.Headers.Add("Authorization", $"Bearer {apiKey}");
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request); 
            response.EnsureSuccessStatusCode();  


            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            return doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString()?.Trim() ?? string.Empty;
        }
    }
}
