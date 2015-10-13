var http = require('http'),
    numCPUs = require('os').cpus().length;
var cp = require('child_process'),
    net = require('net');
var workers = [];
var path = require("path");

Array.prototype.indexOf = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};

Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

var isDebug = function(){
    for(var i=0;i<process.execArgv.length;i++){
        if(process.execArgv[i].indexOf("--debug")==0 ){
            return true;
        }
    }
    return false;
};
var debug = isDebug();

var startchild = function(){
    var cpworker;
    var apppath = path.join(__dirname, "app.js");
    console.log(apppath);
    if (debug){
        cpworker = cp.fork(apppath, ['startwithcluster'], {execArgv: [ '--debug='+(process.debugPort+workers.length+1) ]});
    }else{
        cpworker = cp.fork(apppath, ['startwithcluster']);
    }

    cpworker.on('exit', function () {
        workers.remove(cpworker);
        console.log("cluster worker exit, restarting...");
        startchild();
    });

//    cpworker.on('error', function () {
//        cpworker.exit();
//    });

    workers.push(cpworker);
};

for (var i = 0; i < numCPUs; i++) {
    startchild();
}

var servport = process.env.PORT || 3000;
net.createServer(function(s) {
    s.pause();
    var worker = workers.shift();
    worker.send('c',s);
    workers.push(worker);
}).listen(servport, function(){
    console.log('Express server listening on port ' + servport);
});

