
/**
 * Module dependencies.
 */

var express = require('express');
var path = require('path');
var UCLog = require("./UCBussiness/UCLog");
var cloudexpresslog = require('cloud-expresslog');
var settings = require("./config");
var app = express();
var server = require('http').createServer(app);
var autoroute = require('express-autoroute');
autoroute(app);


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);


//var logsettings = {
//    dbsettings: settings.mysqlconn
//    , logDbName: 'ucLog'
//};
//app.all("*", cloudexpresslog.logger(logsettings));
//
////要修改环境，可以通过设置NODE_ENV环境变量来实现，例如：
////$ NODE_ENV=production node app.js
//if ('development' == app.get('env')) {
//    app.use(express.errorHandler());
//}else{
//    app.use(cloudexpresslog.errorLogger(logsettings));
//    app.use(function(err, req, res, next){
//        res.status(err.status || 500);
//        res.send({ err: 500, msg: "服务器错误" });
//    });
//}

app.use(function(req, res, next){
    res.status(404);
    res.send({ err: 404, msg: "无效的地址" });
});

app.use(express.static(path.join(__dirname, 'public')));
app.all("*", UCLog());

global.sharecode = require("cloud-sharecode")(settings.mysqlconn.uc[0]);

var startwithcluster = function(){
    for(var i= 0, len=process.argv.length;  i< len; i++){
        if(process.argv[i] == "startwithcluster"){
            return true;
        }
    }
    return false;
};

if(startwithcluster()){
    console.log("Cluster worker Started. ");
    process.on("message", function(msg,socket) {
        process.nextTick(function(){
            if(msg == 'c' && socket) {
                socket.readable = socket.writable = true;
                socket.resume();
//                server.connections++;
                socket.server = server;
                server.emit("connection", socket);
                socket.emit("connect");
            }
        });
    });
}else{
    console.log("Dev Started");
    var portnumber = process.env.PORT || 3000;
    server.listen(portnumber, function(){
        console.log('Express server listening on port ' + portnumber);
    });
}
