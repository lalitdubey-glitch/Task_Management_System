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
            error: function (res) {
                console.log(res)
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

                if (res.length>0) {
                    $.each(res, function (index, data) {
                        $("#projectTable tbody").append(
                            `
                            <tr >
                                <td>${index + 1}</td> 
                                 <td>${data.projectName}</td>
                                <td>${data.Description}</td>
                                <td>${data.whoCreate}</td>
                                <td>${data.createAt.split("T")[0]}</td>
                                <td class="text-center">
                                 <input type="button" class="btn btn-success EditPrj" value="Edit" data-pname="${data.projectName}" data-pdesc="${data.Description}" data-id="${data.projectID}"/>
                                 <input type="button" class="btn btn-danger DeletePrj" value="Delete" data-id="${data.projectID}"/>

                                 <input type="button" class="btn btn-primary ViewPrj" value="View Project Task" data-pname="${data.projectName}" data-pdesc="${data.Description}"  data-id="${data.projectID}"/>
                            
                                </td>
                            </tr>
                            
                            `
                        )
                    })

                    $('#projectTable').DataTable();
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

    function ViewProjectDetail(id) {
        $.ajax({
            url: "/admin/selectByProjectId",
            type: "get",
            data: { id: id },
            success: function (res) { 
                $("#AllTask").empty();
                $.each(res, function (index, data) {
                    $("#AllTask").append(
                        `
                          <div class="rounded shadow-lg p-2 my-3">
                          <p> <strong>Assign To : </strong> <span class="rounded p-1 text-success">${data.userName}</span></p>
                           <div><strong>Task Name : </strong>  <span>${data.task}</span></div>
                           <div><strong>Task Desc : </strong>  <span>${data.Description}</span></div>
                           <div><strong>Task Priority : </strong>  <span>${data.priority}</span></div>
                           <div><strong>Task Status : </strong>  <span> ${data.status}</span></div>
                           <div><strong>Created At : </strong>  <span>${data.createAt.split("T")[0]}</span></div>
                           <strong>Due Date : </strong>  <span class="text-danger">${data.DueDate.split("T")[0]}</span>

                          <div class="my-2">
                                <a class="btn btn-success" href="/admin/task">Go To Task</a> 
                            </div>

                          </div>

                        `
                    )
                })
            },
            error: function (res) {

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
                    error: function (res) {
                        console.log(res)
                    }
                })
            }
        })
       
    })

})