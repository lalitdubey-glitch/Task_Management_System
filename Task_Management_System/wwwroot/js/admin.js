$(document).ready(function () {
   
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
                    <td>
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