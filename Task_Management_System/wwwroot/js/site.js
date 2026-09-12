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
              
                if (res.success === "success") {
                    Swal.fire("Success", "User Saved!", "success");
                    document.getElementById('signupForm').reset();

                    setTimeout(function () {
                        location.href = "/home/Login"
                    }, 2000);
                }
                else if (res.success === "Email Already Exists") {
                    Swal.fire("Error", "Email Already Exists", "error");
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