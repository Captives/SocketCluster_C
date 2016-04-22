$(function () {
    var socket = socketCluster.connect();
    console.log(socket);
    socket.on('response', function (data) {
        notify(data.notify, data);
    });

    observe('server', function (data) {
        //像服务端发送自定义事件数据
        socket.emit('messages',data);
    });

    socket.publish('broker', {
        message:'Hello 1'
    });

    socket.emit('broker', {
        message:'Hello 2'
    });

    socket.publish('broadcast', {
        message:'Hello 3'
    });

    socket.publish('broker', {
        message:'Hello 4'
    });

});