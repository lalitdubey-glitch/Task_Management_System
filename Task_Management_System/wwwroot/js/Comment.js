function GetComments(id) {
    $.ajax({
        url: "/home/GetComments",
        type: "get",
        data: { id: id },
        success: function (res) {

            var LoggedInUserId = $("#hdnUserId").val();
             
            $("#userCmt").empty();
            $.each(res, function (index, data) {
                var isMe = LoggedInUserId == data.commentedBy;

                $("#userCmt").append(`
                    <div class="d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'} mb-2">
                        <div class="p-2 rounded ${isMe ? 'bg-primary text-white' : 'bg-light text-dark'}" 
                             style="max-width: 70%">
                             <strong>${data.UserName}</strong>
                            <p class="mb-0">${data.comment}</p>
                            <small>${data.createAt.split("T")[0]}</small> 
                             
                            ${isMe ? `<button class="btn btn-sm btn-danger btnDeleteComment" 
                            data-cmt_id="${data.commentId}" data-task_id="${id}">Delete</button>` : ''}

                        </div>
                    </div>
                    
                `);
            })

        },
        error: function (res) {
            console.log(res)
        }

    })
}

$(document).on("click", ".btnDeleteComment" , function () {
    var id = $(this).data("cmt_id");
    var task_id = $(this).data("task_id");
  
    $.ajax({
        url: "/home/DeleteComment",
        type: "post",
        data: { id: id },
        success: function (res) {
            if (res.success) {
                GetComments(task_id);
            }
        },
        error: function (res) {
            console.log(res)
        }

    })
})
 


function SendCommet(cmt, id, UserEmail, ProjectName, TaskName) {
     
    if (!cmt.trim()) {
        Swal.fire("Warning", "Please Enter Some Comment!", "warning")
        return;
    }

    $.ajax({
        url: "/home/SendComment",
        type: "post",
        data: { cmt: cmt, id: id, UserEmail: UserEmail, ProjectName: ProjectName, TaskName: TaskName },
        beforeSend: function () {
            $("#sendCmt").prop("disabled", true);
            Swal.fire({
                title: "Sending Comment",
                text: "Sending Comment on Email Please Wait...",
                allowOutsideClick: false,
                didOpen : ()=>{
                    Swal.showLoading();
                }
            })
        },
        success: function (res) {
            if (res.success) {
                $("#comment").val('');
                GetComments(id);
            }
            else {
                Swal.fire("Warning", res.messsge , "warning");
            }

            setTimeout(function () {
                var modalBody = $('#EmpModal .modal-body');
                modalBody.animate({ scrollTop: modalBody[0].scrollHeight }, 300);
            }, 100);
        },
        error: function (xhr,status,error) {
            console.log(error)
            Swal.fire("Error" , "Server Error, Please Try Again!" , "error")
        },
        complete: function () {
            $("#sendCmt").prop("disabled", false);
            Swal.close();
        }

    })
}