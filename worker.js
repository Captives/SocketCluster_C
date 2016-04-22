var fs = require('fs');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');


module.exports.run = function (worker) {
    console.log('   >> Worker PID:', process.pid);

    var app = require('express')();
    var httpServer = worker.httpServer;
    var scServer = worker.scServer;
    var mysql = require('mysql');
    var pool = mysql.createPool({
        connectionLimit: 500,
        host: "192.168.10.25",
        user: "root",
        password: "123456",
        database: "example",
        debug: false
    });

    var crypto = require('crypto');
    var session = require('client-sessions');
    var bodyParser = require('body-parser');
    var cookieParser = require('cookie-parser');

    //使HTML格式规范
    app.locals.pretty = true;
    app.set("views", __dirname + "/views");
    app.set("view engine", "jade");
    app.use(serveStatic(path.resolve(__dirname, 'public')));
    app.use(bodyParser.urlencoded({extends: false}));
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.use(session({
        cookieName: 'session',
        secret: 'keyboard-cat',
        duration: 1 * 24 * 60 * 60 * 1000  //1day
    }));

    app.use(function (req, res, next) {
        var url = req.url;
        //console.log("登录session",JSON.stringify(req.session));
        if (req.session.user) {
            if (url == '/session/create') {
                res.redirect('/');
            } else {
                next();
            }
        } else {
            if (url == '/session/create' || url == '/session/store') {
                next();
            } else {
                req.session.error = "You must be logged in to access that area.";
                res.redirect('/session/create');
            }
        }
    });

    app.get("/", function (req, res) {
        res.render("index", {
            title: "Home Page"
        });
    });

    //session 创建
    app.get('/session/create', function (req, res) {
        var error = req.session.error || null;
        var msg = req.session.msg || null;
        delete req.session.error;
        delete req.session.msg;
        res.render('session-create', {
            title: "Login Page",
            error: error,
            msg: msg
        });
    });

    //session 存储
    app.post('/session/store', function (req, res) {
        var phone = req.body.phone;
        var password = crypto.createHash('md5').update(req.body.password).digest('hex');
        //console.log(phone,password);
        pool.query('SELECT * FROM users WHERE phone = ?', [phone], function (err, rows) {
            if (err) {
                console.log(err);
                req.session.error = "Failed to get user account.Please contact an Administrator.";
                res.redirect('back');
            } else {
                if (rows.length) {
                    var user = rows[0];
                    console.log(user.password, password);
                    if (user.password == password) {
                        delete user.password;
                        delete user.image;
                        req.session.user = user;
                        res.redirect('/');
                    } else {
                        req.session.error = "The password does not match.";
                        res.redirect('back');
                    }
                } else {
                    req.session.error = "There is no user with that phone.";
                    res.redirect('back');
                }
            }
        });
    });

    //session 销毁
    app.get('/session/destroy', function (req, res) {
        req.session.destroy();
        req.session.msg = "Successfully logged out!";
        res.redirect('/session/create');
    });

    app.get('*', function (req, res) {
        res.redirect('/');
    });

    httpServer.on('request', app);

    var ModelController = require('./controllers/ModelController.js');
    /*
     In here we handle our incoming realtime connections and listen for events.
     */
    scServer.on('connection', function (socket) {
        console.log("client " + socket.id + " has connected # pid=", process.pid);
        socket.on('messages', function (data) {
            console.log("messages", data);
            ModelController[data.route][data.resource](socket, pool, data);
        });

        socket.on('disconnect', function (data) {
            console.log("Client " + socket.id + " has disconnected!");
        });

        //broker
        socket.on('broker', function (data) {
            console.log("broker", data);
        });
    });
};