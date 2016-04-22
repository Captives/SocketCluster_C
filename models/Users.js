var async = require('async');

var Users = {};
Users.index = function (socket, pool, data) {
    console.log(socket.id, data);
    var results = {
        success: 0,
        message: "Failed to get users",
        notify:"users-index"
    };

    console.log('Users',data);

    function finish() {
        socket.emit('response', results);
    };

    async.series([
        function (callback) {
            var getAllUser = "SELECT * FROM users";
            pool.query(getAllUser, function (err, rows) {
                if(err){
                    console.log("SELECT ERROR",err, getAllUser);
                    console.log("Failed to get users");
                }else{
                    results.users = rows;
                }
                callback();
            });
        }
    ],finish)
};

Users.upload = function (socket, pool, pack) {
    var result = {
        success : 0,
        message : 'Failed to store the file',
        notify : data.notify
    };

    function finish(){
        socket.emit('response', result);
    }

    async.series([
        function(callback){
            var updateImage = "UPDATE users SET images = LOAD_FILE('" + data.filepaht + "') WHERE id = ?";
            pool.query(updateImage,[data.user_id], function (err, rows) {
                if(err){
                    console.log(err);
                    console.log("Failed to update image.");
                }else{
                    callback();
                }
            });
        },
        function(callback){
            var getImage = "SELECT image FROM users WHERE id = ?";
            pool.query(getImage, [data.user_id], function (err, rows) {
                if(err){
                    console.log(err);
                    console.log('Failed to get image data.');
                }else{
                    result.image = (rows.length ? ('data:image/jpeg;base64' + (new Buffer(rows[0].image).toString('base64'))) : null);
                }
                callback();
            });
        }
    ],finish);
};

Users.getProfile = function (socket, pool, data) {
    var result = {
        success:0,
        message:'Failed to get user data.',
        notify:'users-getProfile'
    };

    function finish(){
        socket.emit('response', result);
    }

    async.series([
        function (callback) {
            var getUserData = "SELECT * FROM users WHERE id = ?";
            pool.query(getUserData,[data.id], function (err, rows) {
                if(err){

                }else{
                    result.user = rows[0];
                    result.user.image = (result.user.image?('data:image/jpeg;base64,'+(new Buffer(result.user.image).toString('base64'))) : null);
                    result.success = 1;
                    result.message = "Successfully grabbed data."
                }
                callback();
            });
        }
    ],finish);
};

module.exports = Users;
