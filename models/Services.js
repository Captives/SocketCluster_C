var Services = {};
var files = {};
var fs = require('fs');
var Users = require('./Users');
var baseUrl = __dirname + '/tmp/';

Services.uploadStart = function (socket, pool, data) {
    var name = data.name;
    files[name] = {
        name:name,
        size:data.size,
        data:'',
        downloaded:0
    };

    var place = 0;

    //如果客户端已经开始上传文件，这将确保它不会重新启动
    try{
        var stat = fs.statSync(baseUrl + name);
        if (stat.isFile()) {
            files[name].downloaded = stat.size;
            place = stat.size / 524288;//512kb
        }
    }catch(err){

    }

    fs.open(baseUrl + name, 'a', 0777, function (err, fd) {
        if(err){
            console.log(err);
            console.log('services-uploadStart fs.open error.');
        }else{
            files[name].handler = fd;
            socket.emit('response',{
                success:1,
                message:'File Upload Started',
                notify:data.notify,
                msg:'moredata',
                place:place,
                percent:0,
                name:name
            });
            console.log('目录打开成功',JSON.stringify(files[name]));
        }
    });

};

Services.upload = function (socket, pool, data) {
    var name = data.name;
    files[name].downloaded += data.data.length;
    files[name].data += data.data;
    if(files[name].downloaded == files[name].size){
        fs.write(files[name].handler, files[name].data,null,'Binary', function (err, written) {
            console.log('开始写文件',JSON.stringify(files[name]));
            var pack = {
                user_id : data.user_id,
                filepath : baseUrl + name,
                notify : 'users-upload-create-finish'
            };
            Users.upload(socket, pool, pack);
            socket.emit('response', {
                success : 1,
                message : 'File successfully uploaded',
                notify : data.notify,
                msg : 'uploadingdone'
            });
            console.log('上传完成',JSON.stringify(files[name]));
        });
    }else if(files[name].data.length > 10485760){ //超过10M限制
        fs.write(files[name].handler, files[name].data, null, 'Binary', function (err, written) {
            files[name].data = '';// 清空缓冲区
            console.log('文件开始上传',JSON.stringify(files[name]));
            socket.emit('response', {
                success : 1,
                notify : data.notify,
                message : 'File uploading...',
                msg : 'moredata',
                place : files[name].downloaded / 524288,//512kb
                percent : (files[name].downloaded / files[name].size) * 100,
                name : name
            });
        })
    }else{
        socket.emit('response', {
            success : 1,
            notify : data.notify,
            message : 'File uploading...',
            msg : 'moredata',
            place : files[name].downloaded / 524288,
            percent : (files[name].downloaded / files[name].size)*100 || 0,
            name : name
        });
        console.log('上传中....',JSON.stringify(files[name]));
    }
};

module.exports = Services;