$(document).ready(function () {

    LoadProjectsDropdown();
    UserTable();
    function UserTable() {
        $.ajax({
            url: "/admin/GetUser",
            type: "get",
            success: function (res) {

                if ($.fn.DataTable.isDataTable("#userTable")) {
                    $("#userTable").DataTable().destroy();
                    $("#userTable tbody").empty();
                }

                $.each(res, function (index, data) {
                    $("#userTable tbody").append(`
                <tr>
                    <td>${index+1}</td>
                    <td>${data["name"]}</td>
                    <td>${data["email"]}</td>
                    <td>${data["role"]}</td>
                    <td>${data["createdAt"].split("T")[0]}</td>
                    <td class="text-nowrap">
                        <input type="button" value="Edit" data-id="${data["userId"]}" data-name="${data['name']}" data-email="${data['email']}" data-role="${data['role']}"  class="btn btn-success btnEdit"/>

                         <input type="button" value="Delete" data-id="${data["userId"]}" class="btn btn-danger btnDelete"/>
                    </td>
                </tr>

            `)
                })

                $('#userTable').DataTable();
                 
            },
            error: function (res) {
                console.log(res)
            }
        })
    }

    $(document).on("click", ".btnEdit", function () {
        $("#UserEditModal").modal("show");

        document.getElementById("editForm").scrollIntoView({ behavior: "smooth", block: "center" });

        $("#id").val($(this).data("id"));
        $("#name").val($(this).data("name"));
        $("#email").val($(this).data("email")).prop('readonly',true);
        $("#role").val($(this).data("role")); 

    })


    $("#SaveEdit").on("click", function () {
        var formData = new FormData(document.getElementById("editForm"))
        $.ajax({
            url: "/home/EditUser",
            type: "post",
            data: formData,
            contentType: false,
            processData: false,
            success: function (res) {
                if (res.success) {
                    Swal.fire("Success", "User Edited", "success");
                    UserTable(); 
                    $("#UserEditModal").modal("hide"); 
                }
                else {
                    Swal.fire("Error", "User Not Edited", "error");
                }
            },
            error: function (res) {

            }
        })
    })


    $(document).on("click", ".btnDelete", function () {
        var id = $(this).data("id");

        Swal.fire({
            title: "Are you sure?",
            text: "You want to delete this user? This action cannot be undone.",
            icon: "warning", 
            showCancelButton: true,
            confirmButtonColor: "red", 
            cancelButtonColor: "grey",
            confirmButtonText: "Yes, delete them!"
        }).then((result) => { 
            if (result.isConfirmed) {

                $.ajax({
                    url: "/admin/DeleteUser",
                    type: "post",
                    data: { id: id },
                    success: function (res) {
                        if (res.success) {
                            Swal.fire("Success", "User Deleted!", "success");
                            UserTable();
                        }
                        else {
                            Swal.fire("Error", "User Not Deleted!", "error");
                        }
                    },
                    error: function (res) {
                        console.log(res)
                    }
                })
                 
            }
        });

        
    })

    var canvas = document.getElementById('statsChart')
    if (canvas) {
        var ctx = document.getElementById('statsChart').getContext('2d');
        new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: ['Users', 'Projects', 'Tasks'],
                datasets: [{
                    label: 'Total Count',
                    data: [
                        $("#user").val(),
                        $("#project").val(),
                        $("#task").val()
                    ],
                    backgroundColor: [
                        'blue',
                        'green',
                        'red'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    }

    
     
})

function LoadProjectsDropdown() {

    $.ajax({
        url: "/Admin/GetProject",
        type: "GET",
        dataType: "json",
        success: function (data) {
            var ddl = $("#ddlCopilotProject");
            ddl.empty(); 

            if (data && data.length > 0) {
                ddl.append('<option value=""> -- Select Project --</option>');
                $.each(data, function (index, item) { 
                    ddl.append(`<option value="${item.projectID}">${item.projectName}</option>`);
                });
            } else {
                ddl.append('<option value="">No projects found</option>');
            }
        },
        error: function () {
            $("#ddlCopilotProject").html('<option value="">Failed to load projects</option>');
        }
    });
}
function AskCopilot() {
    var projectId = $("#ddlCopilotProject").val();
    var query = $("#txtCopilotInput").val().trim();
    var chatBox = $("#copilotChatBox");
     
    if (!projectId || projectId <= 0) {
        Swal.fire("Information", "Select the Project from dropdown..!", "info");
        return;
    }

    if (!query) return;
     
    chatBox.append(`
        <div class="mb-2 text-end">
            <div class="d-inline-block bg-primary text-white rounded p-2 text-start small shadow-sm" style="max-width: 85%;">
                ${query}
            </div>
        </div>
    `);

    $("#txtCopilotInput").val("");
    chatBox.scrollTop(chatBox[0].scrollHeight);
     
    var loadId = `load_${Date.now()}`;

    chatBox.append(`
        <div id="${loadId}" class="mb-2">
            <div class="d-inline-block bg-light border rounded p-2 text-start small text-muted">
                Thinking... ⏳
            </div>
        </div>
    `);

    chatBox.scrollTop(chatBox[0].scrollHeight);
     
    $.ajax({
        url: "/AI/AskProjectCopilot",
        type: "POST",
        data: {
            projectId: projectId,
            userQuestion: query
        },
        beforeSend: function () {
            $("#btnSendCopilot").prop("disabled", true);
        },
        success: function (res) {
            $(`#${loadId}`).remove();

            if (res.success) {
                chatBox.append(`
                    <div class="mb-2">
                        <div class="p-2 bg-light border-start border-primary border-3 rounded small shadow-sm">
                            <small class="text-primary fw-bold d-block mb-1">Copilot</small>
                            ${res.data}
                        </div>
                    </div>
                `);
            }
            else {
                chatBox.append(`
                    <div class="mb-2">
                        <div class="p-2 bg-light border-start border-danger border-3 rounded small text-danger">
                            ${res.message || "Failed to process question. Try Again!"}
                        </div>
                    </div>
                `);
            }

            chatBox.scrollTop(chatBox[0].scrollHeight);
        },
        error: function () {
            $(`#${loadId}`).remove();

            chatBox.append(`
                <div class="mb-2 small text-danger">
                    Server communication error.
                </div>
            `);

            chatBox.scrollTop(chatBox[0].scrollHeight);
        },
        complete: function () {
            $("#btnSendCopilot").prop("disabled", false);
            $("#txtCopilotInput").focus();
        }
    });
}