/**
 * Created by Administrator on 2016/4/16.
 */
$(function () {
    var selectFile = null;
    var fileReader = null;
    var oldHTML = null;
    var size = 524288;//512kb
    observe("bind", function () {

    });

    observe("start", function () {

    });

    observe("build-profile", function () {
        notify('server', {
            route : 'Users',
            resource :'getProfile',
            id : $('#user-id').val()
        });
    });

    observe('users-getProfile', function (data) {
        var user = data.user;
        $('#profile-div').empty().html(templatizer['profile']({
            user:user
        }));
        notify('bind-upload');
        $('section[data-route="profile"]').show();
        notify('finish-loading');
    });

    observe('bind-upload', function () {
        //在用户选择一个图像后触发change事件
        $('#users-filebox').change(function (e) {
            selectFile = e.target.files[0];
            //如果该文件是有效的，使upload按钮解除禁用效果
            if(selectFile){
                $('#users-uploadbtn').attr('disabled', false);
            }else{
                $('#users-uploadbtn').attr('disabled', true);
            }
            //再输入框内设置当前选中的文件名
            $('#users-namebox').val(selectFile.name);
        });

        $('#users-uploadbtn').on('click',function (e) {
            if(selectFile && selectFile.name){
                user_id = $(this).data('userid');
                fileReader = new FileReader();
                fileReader.user_id = user_id;
                fileReader.file_name = selectFile.name;
                var content =
                    "<span id='users-namearea'>Uploading " + selectFile.name + "</span>" +
                    '<div id="users-progress-container">' +
                    '<div id="users-progress-bar"></div>' +
                    '</div><span id="users-percent">0%</span>' +
                    "<span id='users-uploaded'> - <span id='users-mb'>0</span>/" + Math.round(selectFile.size / 1048576) + " MB</span>";

                oldHTML = $('#users-uploadarea').html();
                $('#users-uploadarea').html(content);
                fileReader.onload = function (e) {
                    notify('server',{
                        route : 'Services',
                        resource : 'upload',
                        notify : 'users-upload',
                        name : e.target.file_name,
                        data : e.target.result,
                        user_id : e.target.user_id
                    });
                };

                notify('server', {
                    route : 'Services',
                    resource : 'uploadStart',
                    notify : 'users-upload',
                    name : selectFile.name,
                    data : selectFile.size,
                });
            }else{
                $(this).attr(disabled, true);
            }
        });
    });

    observe('users-upload', function (data) {
        if(data.msg == 'moredata'){
            notify('users-upload-progress', data.percent || 100);
            var place = data.place * size;
            var newFile = null;
            if(selectFile.webkitSlice){
                newFile = selectFile.webkitSlice(place, place + Math.min(size, (selectFile.size - place)));
            }else{
                newFile = selectFile.slice(place, place + Math.min(size, selectFile.size - place));
            }
        }else if(data.msg == 'uploadingdone'){
            $('#users-uploadarea').html(oldHTML);
            notify('bind-upload');
        }
    });

    observe('users-upload-progress', function (percent) {
        $('#users-progress-bar').attr('stype', 'width:' + percent + "%");
        $('#users-percent').html(Math.round(percent * 100)/100 + '%');
        var mbDone = Math.round(((percent / 100) * selectFile.size) / 1048576);
        $('#users-mb').html(mbDone);
    });

    observe('users-upload-create-finish', function (data) {
        $("#users-form-image").attr('src',(data.image?data.image:'/images/default-user-image.png'));
    });

});