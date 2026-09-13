$(document).ready(function () {

    var empChart = null;
    selectByMember();

    function selectByMember() {
        $.ajax({
            url: "/Employee/selectByMember",
            type: "get",
            success: function (res) {
                if (res.length > 0) {

                    if ($.fn.DataTable.isDataTable("#EmpTable")) {
                        $("#EmpTable").DataTable().destroy();
                        $("#EmpTable tbody").empty();
                    }


                    $.each(res, function (index, data) {

                        // Date objects banaye
                        const dueDate = new Date(data.DueDate);
                        const createdAt = new Date(data.createAt);
                        const today = new Date();

                        // Time strip kiya (00:00:00) taaki same-day negative round off na ho
                        dueDate.setHours(0, 0, 0, 0);
                        createdAt.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);

                        // Clean Days calculation
                        const totalDays = Math.round((dueDate - createdAt) / 86400000);
                        const leftDays = Math.round((dueDate - today) / 86400000);

                        // Label aur Color logic (Left days par Green, overdue/today par Red)
                        let leftText = "";
                        if (leftDays < 0) {
                            leftText = `${Math.abs(leftDays)}d Overdue`;
                        } else if (leftDays === 0) {
                            leftText = "Due Today";
                        } else {
                            leftText = `${leftDays}d left`;
                        }

                        const rightColorClass = leftDays > 0 ? "text-success fw-bold" : "text-danger fw-bold";

                        $("#EmpTable tbody").append(
                            `
                         <tr>
                             <td>${index + 1}</td>
                             <td>${data.ProjectName}</td> 
                             <td>${data.task}</td>
                             <td>${data.Description}</td>
                             <td>${data.priority}</td>
                             <td>${data.createAt.split("T")[0]}</td>
                             <td class="text-danger fw-bold">${data.DueDate.split("T")[0]}</td>
                             <td>
                               <span class="fw-bold text-dark">${totalDays}d</span> / 
                               <span class="${rightColorClass}">${leftText}</span>
                             </td>
                             <td>
                                 <select class="form-select StatusSelect text-nowrap" style="min-width:120px;" data-status="${data.status}" data-id="${data.taskId}">
                                         <option selected disabled> -- Select Status -- </option>
                                         <option value="todo">To Do</option>
                                         <option value="complete">Complete</option>
                                         <option value="working">Working</option>
                                         <option value="pending">Pending</option>
                                         <option value="pause">Pause</option>
                                 </select> 
                             </td>
                             <td>
                                   <input type="button" value="Breakdown Task" class="btn btn-outline-success btn-sm btnBreakdown"   data-title="${data.task}" data-desc="${data.Description}"  />
                             </td>
                             <td>
                                 <input type="button" value="Detail/Comments" data-id="${data.taskId}" data-task="${data.task}" data-desc="${data.Description}" data-pname="${data.ProjectName}" data-bs-toggle="modal" data-bs-target="#EmpModal" class="btn btn-primary btn_cmt"/>
                             </td>
                         </tr>
                         `
                        );

                        $("#EmpTable tbody tr:last .StatusSelect").val(data.status);
                    });

                    var complete = res.filter(x => x.status === 'complete').length;
                    var pending = res.filter(x => x.status === 'pending').length;
                    var working = res.filter(x => x.status === 'working').length;
                    var pause = res.filter(x => x.status === 'pause').length;
                    var todo = res.filter(x => x.status === 'todo').length;

                    $('#complete').val(complete);
                    $('#pending').val(pending);
                    $('#working').val(working);
                    $('#pause').val(pause);
                    $('#todo').val(todo);

                    var canvas = document.getElementById('empCanva');

                    if (canvas) {
                        if (empChart) {
                            empChart.destroy();
                        }
                        empChart = new Chart(canvas.getContext('2d'), {
                            type: 'doughnut',
                            data: {
                                labels: ['Complete', 'Pending', 'Working', 'Pause', 'To Do'],
                                datasets: [{
                                    label: 'Tasks Summary',
                                    data: [complete, pending, working, pause, todo],
                                    backgroundColor: ['green', 'orange', 'blue', 'grey', 'purple']
                                }]
                            }
                        });
                    }

                    $('#EmpTable').DataTable();
                }
            },
            error: function (res) {
                console.log(res);
            }
        });
    }

    $(document).on("click", ".btnBreakdown", function () {
        var title = $(this).data("title");
        var desc = $(this).data("desc");

        if (!title || !title.trim()) {
            Swal.fire("Warning", "Pehle Task Title enter karein!", "warning");
            return;
        }

        $.ajax({
            url: "/AI/GenerateSubtasks",
            type: "POST",
            data: { taskTitle: title, taskDescription: desc },
            beforeSend: function () {
                $("#btnBreakdown").prop("disabled", true);
                Swal.fire({
                    title: "Generating Subtasks...",
                    text: "AI is breaking down your task into actionable steps...",
                    allowOutsideClick: false,
                    didOpen: () => { Swal.showLoading(); }
                });
            },
            success: function (res) {
                if (res.success) {
                    Swal.close();
                    var subtasks = JSON.parse(res.data);

                    $("#subtaskList").empty();

                    // $.each loop + Template Literals 🎯
                    $.each(subtasks, function (index, step) {
                        $("#subtaskList").append(`
                        <li class="list-group-item d-flex align-items-start gap-3 py-2">
                            <span class="badge bg-primary rounded-pill mt-1">Step ${index + 1}</span>
                            <div class="flex-grow-1 text-dark">${step}</div>
                        </li>
                    `);
                    });

                    $("#subtasksContainer").slideDown();
                } else {
                    Swal.fire("Error", res.message, "error");
                }
            },
            error: function (xhr, status, error) {
                console.error(error);
                Swal.fire("Error", "Server error while contacting AI.", "error");
            },
            complete: function () {
                $("#btnBreakdown").prop("disabled", false);
            }
        });
    });

    $("#txtUserCopilotInput").on("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            $("#btnSendUserCopilot").click();
        }
    });

    $(document).on("click", "#btnSendUserCopilot", function () {
        var query = $("#txtUserCopilotInput").val().trim();
        var chatBox = $("#userChatBox");

        if (!query) {
            Swal.fire("Ask Something...!", "eg : Which task I'm working on?", "info");
            return;
        }

        // 1. User Message Display (Template Literals 🚀)
        chatBox.append(`
        <div class="mb-2 text-end">
            <div class="d-inline-block bg-primary text-white rounded p-2 text-start small shadow-sm" style="max-width: 85%;">
                ${query}
            </div>
        </div>
    `);

        $("#txtUserCopilotInput").val("");
        chatBox.scrollTop(chatBox[0].scrollHeight);
         
        var loadId = `load_${Date.now()}`;
            chatBox.append(`
            <div id="${loadId}" class="mb-2">
                <div class="d-inline-block bg-light border rounded p-2 text-start small text-muted">
                    Checking your tasks... ⏳
                </div>
            </div>
        `);

        chatBox.scrollTop(chatBox[0].scrollHeight);
         
        $.ajax({
            url: "/AI/AskMyTasksCopilot",
            type: "POST",
            data: { userQuestion: query },
            beforeSend: function () {
                $("#btnSendUserCopilot").prop("disabled", true);
            },
            success: function (res) {
                $(`#${loadId}`).remove();
                if (res.success) {
                    chatBox.append(`
                    <div class="mb-2">
                        <div class="p-2 bg-light border-start border-primary border-3 rounded small shadow-sm">
                            <small class="text-primary fw-bold d-block mb-1">Assistant</small>
                            ${res.data}
                        </div>
                    </div>
                `);
                } else {
                    chatBox.append(`
                    <div class="mb-2">
                        <div class="p-2 bg-light border-start border-danger border-3 rounded small text-danger">
                            ${res.message || "Could not retrieve response."}
                        </div>
                    </div>
                `);
                }
                chatBox.scrollTop(chatBox[0].scrollHeight);
            },
            error: function () {
                $(`#${loadId}`).remove();
                chatBox.append('<div class="mb-2 small text-danger">Server communication error.</div>');
                chatBox.scrollTop(chatBox[0].scrollHeight);
            },
            complete: function () {
                $("#btnSendUserCopilot").prop("disabled", false);
                $("#txtUserCopilotInput").focus();
            }
        });
    });

    $(document).on("click", ".btn_cmt", function () {
        var id = $(this).data("id");
        $("#id").val(id);
        $("#taskName").text($(this).data("task"));
        $("#taskDesc").text($(this).data("desc")); 
        $("#pName").text($(this).data("pname"));

        GetComments(id);

    })

    $("#sendCmt").on("click", function () {
        var cmt = $("#comment").val();
        var id = $("#id").val();
        var TaskName =  $("#pName").text()
        var ProjectName = $("#taskName").text()
        var UserEmail = $("#email").val();

        SendCommet(cmt, id, UserEmail, ProjectName, TaskName);

    })

    $("#userEdit").on("click", function () {
        $("#UserEditModal").modal("show");
         
    })

    $("#SaveEdit").on("click", function () {
        var formData = new FormData(document.getElementById("editFormUserModal"))
        $.ajax({
            url: "/home/EditUser",
            type: "post",
            data: formData,
            contentType: false,
            processData: false,
            success: function (res) {
                if (res.success) {
                    Swal.fire("Success", "User Edited", "success");
                    
                    $("#UserEditModal").modal("hide");
                    setTimeout(function () {
                        location.reload();
                    },1000)
                   
                }
                else {
                    Swal.fire("Error", "User Not Edited", "error");
                }
            },
            error: function (res) {

            }
        })
    })

    $("#frgtPass").on("click", function () {
        $("#SendOtpModal").modal("show")
        $("#UserEditModal").modal("hide");
    })

    $("#BtnVerifyOtp").on("click", function () {
        var UserOTP = $("#otp").val().trim();
        var btn = $(this);

        if (!UserOTP) {
            Swal.fire("Warning", "Please Enter the OTP!", "warning");
            return;
        }


        $.ajax({
            url: "/employee/VerifyOTP",
            type: "post", 
            data: { UserOTP: UserOTP },
            beforeSend: function() {
                btn.prop("disabled" , true)
            },
            success: function (res) {
                if (res.success) {
                    Swal.fire({
                        title: "Success",
                        text: res.message || "OTP Verified Successfully!",
                        icon: "success",
                        timer: 1000,
                        showConfirmButton: false
                    }).then(() => {
                        $("#VerifyOtpModal").modal("hide");
                        $("#otp").val("");  
                        $("#ChangePassModal").modal("show");
                    });
                } else {  
                    Swal.fire({
                        title: "Warning",
                        text: res.message || "Invalid OTP!",
                        icon: "warning",
                        allowOutsideClick: false,
                        showConfirmButton: true,
                        timer:2000
                    })
                }
            },
            error: function (xhr, status, error) {
                console.error("Verification Error:", error);
                Swal.fire("Error", "Server error. Please try again later.", "error");
            },
            complete: function () {
                btn.prop("disabled", false); 
            }

        })
    })

    $("#BtnChangePass").on("click", function () {
        var pass = $("#pass").val();

        if (!pass) {
            Swal.fire("Warning", "Please Enter New Password!", "warning");
            return;
        }

        $.ajax({
            url: "/employee/ResetPass",
            type: "post", 
            data: { pass: pass },
            success: function (res) {
                if (res.success) {
                    Swal.fire("Success", "Password Changed", "success");
                    $("#ChangePassModal").modal("hide");
                    $("#VerifyOtpModal").modal("hide");
                }
                else {
                    Swal.fire("Error", "OTP Not Veryfied!", "error");
                }
            },
            error: function (res) {
                console.log(res)
            }

        })
    })

    $("#BtnSendOtp").on("click", function () {
        var email = $("#forgotEmail").val();
        if (!email) {
            Swal.fire("Warning", "Please Enter Your Email First..!","warning");
            return;
        }

        var btn = $(this);
        $.ajax({
            url: "/employee/SendOTP",
            type: "post",
            beforeSend: function () {
                btn.prop("disabled", true);
                Swal.fire({
                    title: "Sending OTP...",
                    text: "Please wait while we send the verification code.",
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                })
            },
            success: function (res) {
                if (res.success) { 
                    Swal.fire({
                        title: "Success",
                        text: res.message || "OTP Sent!",
                        icon: "success",
                        timer: 1000,
                        allowOutsideClick: false,
                        showConfirmButton: true
                    }).then(() => {
                        $("#SendOtpModal").modal("hide")
                        $("#VerifyOtpModal").modal("show")
                    })
                  
                }
                else {
                    Swal.fire("Error", res.message , "error");
                }
               
            },
            error: function (xhr, status, error) {
                console.error("OTP Error:", error);
                Swal.fire("Error", "Server error. Please try again later.", "error");
            },
            complete: function () {
                btn.prop("disabled", false);
            }

        })
    })

    $(document).on("change", ".StatusSelect", function () {
        var status = $(this).val();
        var id = $(this).data("id");
        
        $.ajax({
            url: "/employee/ChangeStatus",
            type: "post", 
            data: {id:id, status: status },
            success: function (res) {
                Swal.fire("Success", "Success", "success");
                selectByMember();
            },
            error: function (res) {
                console.log(res)
            }

        })
    })

    
    
})

