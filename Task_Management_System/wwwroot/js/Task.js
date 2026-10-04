$(document).ready(function () {

    TaskTable();
    GetUser();
    GetProject(); 

    $("#DueDate").on("click",function () {
        this.showPicker();
    })

    function GetUser() {
        $.ajax({
            url: "/admin/GetUser",
            type: "get",
            success: function (res) { 
                $("#AssignedTo").empty();
                $("#AssignedTo").append("<option selected disabled>Select User</option>")

                if (res.data.length > 0) {
                    $.each(res.data, function (index, item) {
                        $("#AssignedTo").append(
                            `
                        <option value="${item["userId"]}" data-email="${item["email"]}"> ${item["name"]} </option>
                        `
                        );
                    })
                }
                else {
                    $("#AssignedTo").append("<option selected disabled>No User Found</option>")
                }

            },
            error: function (xhr, status, error) {
                var err = null;
                try {
                    err = JSON.parse(xhr.responseText)
                }
                catch (e) {
                    err = xhr.responseText
                }

                Swal.fire("Server Error", "Something went wrong, Please check your internet connection or Try Again Leter...!", "error")
                console.log(err)
            }
        })
    }

    $("#AssignedTo").on("change", function () {
        var email = $(this).find(":selected").data("email");
        $("#email").val(email)
    })

    function GetProject() {
        $.ajax({
            url: "/Admin/GetProject",
            type: "get",
            success: function (res) { 
                 
                if (res.data.length > 0) {
                    $("#projectId").empty();
                    $("#projectId").append("<option selected disabled> -- Select Project -- </option>")

                    $.each(res.data, function (index, d) {
                        $("#projectId").append(
                            `
                         <option value="${d.projectID}"> ${d.projectName} </option>
                        `
                        );
                    })
                }
                else {
                    Swal.fire("Error", "No Data Found in get Prj Task!", "error");
                }
            },
            error: function (xhr, status, error) {
                var err = null;
                try {
                    err = JSON.parse(xhr.responseText)
                }
                catch (e) {
                    err = xhr.responseText
                }

                Swal.fire("Server Error", "Something went wrong, Please check your internet connection or Try Again Leter...!", "error")
                console.log(err)
            }
        })
    }

    function TaskTable() {
        $.ajax({
            url: "/admin/GetTask",
            type: "get",
            success: function (res) {
                if (res.data.length > 0) {
                    if ($.fn.DataTable.isDataTable("#TaskTable")) {
                        $("#TaskTable").DataTable().destroy();
                        $("#TaskTable tbody").empty();
                    }

                    $.each(res.data, function (index, item) { 


                        const dueDate = new Date(item.dueDate);
                        const createdAt = new Date(item.createAt);
                        const today = new Date();

                        // Time strip kiya (00:00:00) taaki timezone aur hours ka bug na aaye
                        dueDate.setHours(0, 0, 0, 0);
                        createdAt.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                         
                        const totalDays = Math.round((dueDate - createdAt) / 86400000);
                        const leftDays = Math.max(0, Math.round((dueDate - today) / 86400000));
                          

                        var bg_color = null;
                        var priority = (item.priority).toLowerCase().trim();

                        if (priority == "low") {
                            bg_color = "bg-primary text-white";
                        }
                        else if (priority == "normal") {
                            bg_color = "bg-success text-white";
                        }
                        else {
                            bg_color = "bg-danger text-white";
                        }

                        $("#TaskTable tbody").append(
                            `
                        <tr>
                            <td>${item.userName}</td>
                            <td>${item.projectName}</td>
                            <td>${item.task}</td>
                            <td>${item.description}</td>
                            <td>${item.status}</td>
                            <td>${item.createAt.split("T")[0]}</td>
                            <td class="text-danger fw-bold">${item.dueDate.split("T")[0]}</td>
                              <td>
                              <span class="fw-bold text-dark">${totalDays}d</span> / 
                              <span class="fw-bold ${leftDays > 0 ? 'text-success' : 'text-danger'}">${leftDays}</span>
                            </td>
                            <td class="${bg_color}">${item.priority}</td>
                            <td class="text-center text-nowrap">
                                <input type="button" value="Edit" class="btn btn-warning BtntaskEdit" data-email="${item.userEmail}" data-id="${item.taskId}"/> 
                                <input type="button" value="Delete" class="btn btn-danger BtntaskDelete" data-id="${item.taskId}"/> 
                            </td>
                            <td>
                                <input type="button" value="Comments" data-id="${item.taskId}" data-task="${item.task}" data-desc="${item.description}" data-email="${item.userEmail}" data-pname="${item.projectName}" data-bs-toggle="modal" data-bs-target="#EmpModal" class="btn btn-primary btn_cmt"/>
                            </td>
                        </tr>
                        `
                        );
                    });

                    $('#TaskTable').DataTable();
                }
            },
            error: function (xhr, status, error) {
                var err = null;
                try {
                    err = JSON.parse(xhr.responseText)
                }
                catch (e) {
                    err = xhr.responseText
                }

                Swal.fire("Server Error", "Something went wrong, Please check your internet connection or Try Again Leter...!", "error")
                console.log(err)
            }
        });
    }

    $(document).on("click", ".btn_cmt", function () {
        var id = $(this).data("id");
        $("#id").val(id);
        $("#taskName").text($(this).data("task"));
        var d = $("#pName").text($(this).data("pname"));
        $("#taskDesc").text($(this).data("desc"));
        $("#email").val($(this).data("email"));
            
        GetComments(id);

    })

    $("#sendCmt").on("click", function () {
        var cmt = $("#comment").val();
        var id = $("#id").val();
        var UserEmail = $("#email").val();
        var ProjectName = $("#pName").text();
        var TaskName = $("#taskName").text();

        SendCommet(cmt, id, UserEmail, ProjectName, TaskName);

    })

    $(document).on("click", ".BtntaskEdit", function () {

        document.getElementById("TaskForm").scrollIntoView({ behavior: "smooth",  block: "center" });
        var email = $(this).data("email");
        $("#email").val(email)
      
        var id = $(this).data("id");
        $("#taskId").val(id);
        $("#btnTask").val("Edit Task");
        $("#TaskForm h2").text("Edit Task");
        $.ajax({
            url: "/admin/GetTaskById",
            type: "get",
            data: { id: id },
            success: function (res) {
                if (res.length > 0) { 
                    $("#task").val(res[0]["task"]);
                    $("#AssignedTo").val(res[0]["AssignedTo"]);
                    $("#projectId").val(res[0]["projectId"]);
                    $("#DueDate").val(res[0]["DueDate"].split("T")[0]);
                    $("#priority").val(res[0]["priority"]);
                    $("#status").val(res[0]["status"]);
                    $("#Description").val(res[0]["Description"]);
                }
                else {
                    Swal.fire("info", "No Task Found!", "info");
                }

                TaskTable();
            },
            error: function (xhr, status, error) {
                var err = null;
                try {
                    err = JSON.parse(xhr.responseText)
                }
                catch (e) {
                    err = xhr.responseText
                }

                Swal.fire("Server Error", "Something went wrong, Please check your internet connection or Try Again Leter...!", "error")
                console.log(err)
            }
        })
    })

    $(document).on("click", ".BtntaskDelete", function () {
        var id = $(this).data("id");
        Swal.fire({
            title: "Are you sure?",
            text: "You want to Deleted this Task?",
            icon: "warning",
            showCancelButton: true,

        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: "/admin/TaskDelete",
                    type: "post",
                    data: { id: id },
                    success: function (res) {
                        if (res.success) {
                            Swal.fire("Success", "Task Deleted", "success");
                        }
                        else {
                            Swal.fire("Error", "Task Not Deleted!", "error");
                        }

                        TaskTable();

                    },
                    error: function (xhr, status, error) {
                        var err = null;
                        try {
                            err = JSON.parse(xhr.responseText)
                        }
                        catch (e) {
                            err = xhr.responseText
                        }

                        Swal.fire("Server Error", "Something went wrong, Please check your internet connection or Try Again Leter...!", "error")
                        console.log(err)
                    }
                })
            }
        })
    })
 
    $("#btnTask").on("click", function () {
        var form = document.getElementById("TaskForm")
        var formData = new FormData(form)
        var btn = $(this);

        $.ajax({
            url: "/admin/Task",
            type: "post",
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function () {
                btn.prop("disabled", true);
                Swal.fire({
                    title: "Sending Task",
                    text: "Sending Task to User Email , Please wait...",
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                })
            },
            success: function (res) {
                if (res.success) {
                    Swal.fire("Success", res.message || "Task assigned successfully!", "success");
                    form.reset();
                    btn.val("Add Task");
                    $("#TaskForm h2").text("Add Task");
                    TaskTable();
                }
                else {
                    Swal.fire("Error", res.message || "Command Unsuccessful", "error");
                }

            },
            error: function (xhr, status, error) {
                var err = null;
                try {
                    err = JSON.parse(xhr.responseText)
                }
                catch (e) {
                    err = xhr.responseText
                }

                Swal.fire("Server Error", "Something went wrong, Please check your internet connection or Try Again Leter...!", "error")
                console.log(err)
            },
            complete: function () {
                btn.prop("disabled", false);
            }
        })
    })
})