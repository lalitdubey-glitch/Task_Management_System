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
                $("#AssignedTo").append("<option selected disabled> -- Select User -- </option>")
                
                $.each(res, function (index, data) {
                    $("#AssignedTo").append(
                        `
                        <option value="${data["userId"]}" data-email="${data["email"]}"> ${data["name"]} </option>
                        `
                    ); 
                })

            },
            error: function (res) {
                console.log(res)
            }
        })
    }

    $("#AssignedTo").on("change", function () {
        var email = $(this).find(":selected").data("email");
        $("#email").val(email)
    })

    function GetProject() {
        $.ajax({
            url: "/admin/GetProject",
            type: "get",
            success: function (res) {
                if (res.length > 0) {
                    $("#projectId").empty();
                    $("#projectId").append("<option selected disabled> -- Select Project -- </option>")

                    $.each(res, function (index, data) {
                        $("#projectId").append(
                        `
                         <option value="${data["projectID"]}"> ${data.projectName} </option>
                        `
                        );
                    })
                }
                else {
                    Swal.fire("Error", "No Data Found!", "error");
                }
            },
            error: function (res) {
                console.log(res)
            }
        })
    }

    function TaskTable() {
        $.ajax({
            url: "/admin/GetTask",
            type: "get",
            success: function (res) { 
                if (res.length > 0) {
                    if ($.fn.DataTable.isDataTable("#TaskTable")) {
                        $("#TaskTable").DataTable().destroy();
                        $("#TaskTable tbody").empty();
                    }

                    $.each(res, function (index, data) {
                        $("#TaskTable tbody").append(
                            `
                            <tr>
                                <td>${data.userName}</td>
                                <td>${data.projectName}</td>
                                <td>${data.task}</td>
                                <td>${data.Description}</td>
                                <td>${data.priority}</td>
                                <td>${data.status}</td>
                                <td>${data.createAt.split("T")[0]}</td>
                                <td class="text-danger fw-bold">${data.DueDate.split("T")[0]}</td>
                                <td class="text-center">
                                    <input type="button" value="Edit" class="btn btn-warning BtntaskEdit m-2 " data-email="${data.userEmail}" data-id="${data.taskId}"/> 
                                    <input type="button" value="Delete" class="btn btn-danger BtntaskDelete" data-id="${data.taskId}"/> 
                                </td>
                                <td>
                                    <input type="button" value="Comments" data-id="${data.taskId}" data-task="${data.task}" data-desc="${data.Description}" data-email="${data.userEmail}" data-pname="${data.projectName}" data-bs-toggle="modal" data-bs-target="#EmpModal" class="btn btn-primary btn_cmt"/>
                                </td>
                            </tr>
                            `
                        )
                    })

                  
                    $('#TaskTable').DataTable();
                }
            },
            error: function (res) {

            }
        })
    }

    $(document).on("click", ".btn_cmt", function () {
        var id = $(this).data("id");
        $("#id").val(id);
        $("#taskName").text($(this).data("task"));
        var d = $("#pName").text($(this).data("pname"));
        debugger
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
        debugger
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
            error: function (res) {

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
                    error: function (res) {
                        console.log(res)
                    }
                })
            }
        })
    })
 
    $("#btnTask").on("click", function () {
        var formData = new FormData(document.getElementById("TaskForm"))
        $.ajax({
            url: "/admin/Task",
            type: "post",
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function () {
                $("#btnTask").prop("disabled", true);
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
                    Swal.fire("Success", "Command Successful", "success");
                    document.getElementById("TaskForm").reset();
                    $("#btnTask").val("Add Task");
                    $("#TaskForm h2").text("Add Task");
                    TaskTable();
                }
                else {
                    Swal.fire("Error", "Command Unsuccessful", "error");
                }

            },
            error: function (res) {
                console.log(res)
            },
            complete: function () {
                $("#btnTask").prop("disabled", false);
            }
        })
    })
})