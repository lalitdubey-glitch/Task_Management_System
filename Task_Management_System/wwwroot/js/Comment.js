
GetTodayCommentsByLoggedInUser();

function GetComments(id) {
    $.ajax({
        url: "/home/GetComments",
        type: "get",
        data: { id: id },
        success: function (res) {

            var LoggedInUserId = $("#hdnUserId").val();
             
            $("#userCmt").empty();
            $.each(res.data, function (index, item) {
                var isMe = LoggedInUserId == item.commentedBy;

                $("#userCmt").append(`
                    <div class="d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'} mb-2">
                        <div class="p-2 rounded ${isMe ? 'bg-primary text-white' : 'bg-light text-dark'}" 
                             style="max-width: 70%">
                             <strong>${item.userName}</strong>
                            <p class="mb-0">${item.comment}</p>
                            <small>${item.createAt.split("T")[0]}</small> 
                             
                            ${isMe ? `<button class="btn btn-sm btn-danger btnDeleteComment" 
                            data-cmt_id="${item.commentId}" data-task_id="${id}">Delete</button>` : ''}

                        </div>
                    </div>
                    
                `);
            })

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
                GetTodayCommentsByLoggedInUser();
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


function SendCommet(cmt, id, UserEmail, ProjectName, TaskName) {
     
    if (!cmt.trim()) {
        Swal.fire("Warning", "Please write somthing!", "warning")
        return;
    }

    $.ajax({
        url: "/home/SendComment",
        type: "post",
        data: { cmt: cmt, id: id, UserEmail: UserEmail, ProjectName: ProjectName, TaskName: TaskName },
        beforeSend: function () {
            $("#sendCmt").prop("disabled", true);
            //Swal.fire({
            //    title: "Sending Comment",
            //    text: "Sending Comment Please Wait...",
            //    allowOutsideClick: false,
            //    didOpen : ()=>{
            //        Swal.showLoading();
            //    }
            //})
        },
        success: function (res) {
            if (res.success) {
                $("#comment").val('');
                GetComments(id);
                GetTodayCommentsByLoggedInUser();
            }
            else {
                Swal.fire("Warning", "Comment not sent!" , "warning");
            }

            setTimeout(function () {
                var modalBody = $('#EmpModal .modal-body');
                modalBody.animate({ scrollTop: modalBody[0].scrollHeight }, 300);
            }, 100);
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
            $("#sendCmt").prop("disabled", false);
            Swal.close();
        }

    })
}

function GetTodayCommentsByLoggedInUser() {
    $.ajax({
        url: "/Home/selectAllCommentsByLoggedInUser",
        type: "get", 
        success: function (res) {
            var cmtBody = $("#newComments").find(".offcanvas-body")
            var totalCmt = $("#newComments").find("#newCommentsLabel span")

            cmtBody.empty(); 
            totalCmt.empty(); 

            if (res.success && res.data.length > 0) {
                var totalCmment = res.data.length;
                totalCmt.text(totalCmment).addClass("mx-1 rounded-circle shadow px-2 bg-dark text-white  border border-2");
                      
                    $.each(res.data, function (index, item) {

                        cmtBody.append(`
                            
                            <div class="card my-3">
                              <h5 class="card-header bg-dark text-white">${item.projectName}</h5>
                              <div class="card-body bg-light">
                                <strong class="card-title">${item.task}</strong>
                                <i><p class="card-text">${item.comment}</p> </i>
                              </div>
                            </div>
                    
                        `);
                })
            }
            else {
                cmtBody.append("<h2 class='shadow p-3 text-muted rounded-3'>No comments on any task today!</h2>")
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