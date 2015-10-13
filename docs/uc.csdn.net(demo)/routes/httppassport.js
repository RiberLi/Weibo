/**
 * Created by Liujunjie on 13-12-17.
 */

module.exports.autoroute = {
    get: {
        '/passport' : reqpassport
        , '/requestpassport': requestpassport
    }
};

function reqpassport(req, res) {
    var http = require('http');
    var querystring = require('querystring');
    var post_data = querystring.stringify({
        product : 'club',
        sign : 'ddddddddddddddd',
        sender: '发送者的名字:超级管理员',
        uids : ['ffwq@qq.com', 'ffqwf@www.com'],
        msg : 'wwww'
    });

    var options = {
        host: '127.0.0.1',
        port: 3000,
        path: '/codeclass/getclasslist',
        method: 'POST'
    };


    var req = http.request(options, function(ress) {
        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));
        ress.setEncoding('utf8');
        ress.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
            res.send('BODY: ' + chunk);
        });
    });

// write data to request body
    //req.write(post_data + "\n");
    //req.end();
}

function requestpassport(req, res){
    var request = require('request');
    request('http://www.google.com', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body) // Print the google web page.
        }
    });
}