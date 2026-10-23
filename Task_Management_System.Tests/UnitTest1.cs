//namespace Task_Management_System.Tests
//{
//    public class UnitTest1
//    {
//        [Fact]
//        public void Test1()
//        {

//        }
//    }
//}

using Microsoft.AspNetCore.Mvc;
using Task_Management_System.Controllers;
using System.Text.Json;

public class EmployeeControllerTests
{
    [Fact]
    public void VerifyOTP_EmptyOtp_ReturnsJsonResult()
    {
        var controller = new EmployeeController(null!, null!);

        var result = controller.VerifyOTP("");

        Assert.IsType<JsonResult>(result);
    }

    [Fact]
    public void VerifyOTP_EmptyOtp_ReturnsPleaseEnterOtpMessage()
    {
        var controller = new EmployeeController(null!, null!);

        var result = controller.VerifyOTP("") as JsonResult;

        string json = JsonSerializer.Serialize(result!.Value);

        Assert.Contains("Please enter OTP.", json);
    }


}