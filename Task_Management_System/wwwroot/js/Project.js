$(document).ready(function () { 
    projectTable();

    $("#addProject").on("click", function () { 
        var formData = new FormData(document.getElementById('projectForm'));
        $.ajax({
            url: "/admin/Project",
            type: "post",
            data: formData,
            contentType: false,
            processData: false,
            success: function (res) {
                if (res.success) {
                    Swal.fire("Success", "Command Successful", "success");
                    document.getElementById('projectForm').reset();
                    $("#addProject").val("Add Project");
                    $("#projectForm h2").text("Add Project");
                    projectTable();
                }
                else {
                    Swal.fire("Error", "Project Not Added!", "error");
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
    })

    function projectTable() {
        $.ajax({
            url: "/admin/GetProject",
            type: "get", 
            success: function (res) {
                 
                if ($.fn.DataTable.isDataTable("#projectTable")) {
                    $("#projectTable").DataTable().destroy();
                    $("#projectTable tbody").empty();
                }

                if (res.success && res.data.length > 0) {
                    $.each(res.data, function (index, item) {
                        $("#projectTable tbody").append(
                            `
                            <tr >
                                <td>${index + 1}</td> 
                                 <td>${item.projectName}</td>
                                <td>${item.description}</td>
                                <td>${item.whoCreate}</td>
                                <td>${item.createAt.split("T")[0]}</td>
                                <td>
                                    <input type="button" value="Summerize with Ai" data-id="${item.projectID}" class="btn btn-outline-success prjAi"/>
                                </td>
                                <td class="text-center">
                                 <input type="button" class="btn btn-success EditPrj" value="Edit" data-pname="${item.projectName}" data-pdesc="${item.description}" data-id="${item.projectID}"/>
                                 <input type="button" class="btn btn-danger DeletePrj" value="Delete" data-id="${item.projectID}"/>

                                 <input type="button" class="btn btn-primary ViewPrj" value="View All Tasks" data-pname="${item.projectName}" data-pdesc="${item.description}"  data-id="${item.projectID}"/>
                            
                                </td>
                            </tr>
                            
                            `
                        )
                    })

                    $('#projectTable').DataTable();
                }
                else {
                    Swal.fire("Info", "No Project Found!", "info");
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

    $(document).on("click", ".prjAi", function () {
        var pId = $(this).data("id");

        if (!pId) {
            Swal.fire("Warning", "Project ID missing ya invalid hai!", "warning");
            return;
        }

        $.ajax({
            url: "/AI/GenerateProjectSummary",
            type: "GET",
            data: { projectId: pId },
            beforeSend: function () {
                $("#btnProjectSummary").prop("disabled", true);
                Swal.fire({
                    title: "Analyzing Project...",
                    text: "Scanning all tasks, assigned owners, and recent comments...",
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
            },
            success: function (res) {
                if (res.success) {
                    Swal.close(); 
                    $("#aiSummaryBody").html(res.data);
                    $("#aiSummaryContainer").slideDown(300);
                     
                    $('html, body').animate({
                        scrollTop: $("#aiSummaryContainer").offset().top - 80
                    }, 400);
                } else {
                    Swal.fire("Notice", res.message || "Summary generate nahi ho saki.", "info");
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
                $("#btnProjectSummary").prop("disabled", false);
            }
        });
    })
    

    function ViewProjectDetail(id) {
        $.ajax({
            url: "/admin/selectByProjectId",
            type: "get",
            data: { id: id },
            success: function (res) { 
                $("#AllTask").empty();
                if (res.success && res.data.length > 0) {
                    $.each(res.data, function (index, item) {
                        $("#AllTask").append(
                            `
                          <div class="rounded shadow-lg p-2 my-3">
                          <p> <strong>Assign To : </strong> <span class="rounded p-1 text-success">${item.userName}</span></p>
                           <div><strong>Task Name : </strong>  <span>${item.task}</span></div>
                           <div><strong>Task Desc : </strong>  <span>${item.description}</span></div>
                           <div><strong>Task Priority : </strong>  <span>${item.priority}</span></div>
                           <div><strong>Task Status : </strong>  <span> ${item.status}</span></div>
                           <div><strong>Created At : </strong>  <span>${item.createAt.split("T")[0]}</span></div>
                           <strong>Due Date : </strong>  <span class="text-danger">${item.dueDate.split("T")[0]}</span>

                          <div class="my-2">
                                <a class="btn btn-success" href="/admin/task">Go To Task</a> 
                            </div>

                          </div>

                        `
                        )
                    })
                }
                else {
                    $("#AllTask").append(`<h2>No Task</h2>`);
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

    $(document).on("click", ".ViewPrj", function () {
        var id = ($(this).data("id"));
        var pname = ($(this).data("pname"));
        var pdesc = ($(this).data("pdesc"));
        $("#PrjName").text(pname);
        $("#PrjDesc").text(pdesc);
        $('#ViewUserTask').modal('show');
        ViewProjectDetail(id);

    })

    $(document).on("click", ".EditPrj", function () {
        document.getElementById("projectForm").scrollIntoView({ behavior: "smooth",  block: "center"  });
        $("#addProject").val("Edit Project");
        $("#projectForm h2").text("Edit Project");
        $("#projectID").val($(this).data("id"));
        $("#projectName").val($(this).data("pname"));
        $("#Description").val($(this).data("pdesc"));
    })

    $(document).on("click", ".DeletePrj", function () {
        var id = $(this).data("id");
      
        Swal.fire({
            title: "Are You Sure?",
            text: "Do you really want to Delete this Project?",
            icon: "warning",
            showCancelButton: true 
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: "/admin/DeleteProject",
                    type: "post",
                    data: { id: id },
                    success: function (res) {
                        if (res.success) {
                            Swal.fire("Success", "Project Delete", "success"); 
                            projectTable();
                        }
                        else {
                            Swal.fire("Error", "Project Not Delete!", "error");
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
        })
       
    })

})