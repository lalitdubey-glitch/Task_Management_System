$(document).ready(function () {

    $("#btnSignup").on("click", function () {
        var formdata = new FormData(document.getElementById('signupForm'));
        if ($("input[required]").val().trim() === "") {
            Swal.fire("Info", "Please! Fill All Fields", "info");
            return
        }

        Swal.fire({
            title: 'Verifying...',
            text: 'Please wait while we check your credentials.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        $.ajax({
            url: "/home/SignUp",
            type: "post",
            data: formdata,
            processData: false,
            contentType: false,
            success: function (res) {
                if (res.ms == "invalid email") {
                    Swal.fire("Info", "Please enter valid Email Address", "info"); 
                }
                else if (res.success === "Email Already Exists") {
                    Swal.fire("Error", "Email Already Exists", "error");
                }
                else if (res.success === "success") {
                    Swal.fire("Success", "User Saved!", "success");
                    document.getElementById('signupForm').reset();

                    setTimeout(function () {
                        location.href = "/home/Login"
                    }, 2000);
                }
                else {
                    Swal.fire("Error", "User Not Added!", "error");
                }
            },
            error: function (res) {
                console.log(res)

            }
        })
    })

    $("#BtnLogin").on("click", function () {
        var formData = new FormData(document.getElementById("loginForm"));

        Swal.fire({
            title: 'Verifying...',
            text: 'Please wait while we check your credentials.',
            allowOutsideClick: false, 
            didOpen: () => {
                Swal.showLoading();
            }
        });

        $.ajax({
            url: "/home/Login",
            type: "post",
            data: formData,
            contentType: false,
            processData: false,
            success: function (res) {
                if (res.success === "success") {
                    Swal.fire({
                        title: "Success",
                        text: "Welcome ! " + res.userName + " Redirecting in a moment...",
                        icon: "success",
                        showConfirmButton: false,
                        timer:2000
                    }).then(() => { 
                        if (res.userRole == "admin") {
                            location.href = "/admin/index"
                        }
                        else if (res.userRole == "hr") {
                            location.href = "/employee/index"
                        }
                        else if (res.userRole == "manager") {
                            location.href = "/employee/index"
                        }
                        else if (res.userRole == "employee") {
                            location.href = "/employee/index"
                        }
                        else{
                            location.href = "/home/index"
                        }
                        
                    })
                    document.getElementById('loginForm').reset(); 
                } 
                else {
                    Swal.fire("Error", "Email or Password is not correct! Try Again!", "error");
                }
            },
            error: function (res) {
                console.log(res)
            }
        })
    })

    // Jab bhi SweetAlert screen par ho, modal ke action ko roka
    $(document).on("keydown", function (e) {
        if (Swal.isVisible() && e.which === 32) {
            // Agar user kisi text input box ke andar type nahi kar raha
            if (!$(e.target).is("input, textarea")) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    });

})

function PolishWithAI() {
    var rawComment = $("#comment").val().trim();

    if (!rawComment) {
        Swal.fire("Warning", "Write Something in Comment box First!", "warning");
        return;
    }

    $.ajax({
        url: "/AI/PolishComment",
        type: "POST",
        data: { cmt: rawComment },
        beforeSend: function () {
            $("#btnPolishCmt").prop("disabled", true);
            Swal.fire({
                title: "AI Polishing...",
                text: "Refining your comment into a professional update...",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        },
        success: function (res) {
            if (res.success) {
                $("#comment").val(res.data);
                Swal.fire({
                    icon: "success",
                    title: "Polished!",
                    text: "Comment professional format me update ho gaya hai.",
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                Swal.fire("Error", res.message || "Failed to polish comment", "error");
            }
        },
        error: function (xhr, status, error) {
            console.error(error);
            Swal.fire("Error", "AI service connect nahi ho payi. Please try again!", "error");
        },
        complete: function () {
            $("#btnPolishCmt").prop("disabled", false);
        }
    });
}

  
 