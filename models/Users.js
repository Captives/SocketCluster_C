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

module.exports = Users;
