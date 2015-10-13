/**
 * Created by Liujunjie on 13-12-20.
 */

exports.autoroute = {
    "get" : {
        '/qr': qr
        , '/file':file
    }
};

function qr(req, res){
    var fs = require('fs');
    var time = require('../Utility/time')();
    var today = new Date();
    var Y = today.getFullYear();
    var M = today.getMonth() + 1;
    //var filename = 'qr_' + CSDNID.toString() + '_' + time.shorttime() + '.png';
    //var path = require('../appconfig').qr.path + Y + '/' + M + '/';
    //var url = require('../appconfig').qr.saveUrl + filename ;
    var path = 'path/2014/1'
    var pathArr = path.split('/');
    var p = '';
    for(var i=0 ; i<pathArr.length ; i++){
        if(pathArr[i].length>0){
            if(i==0){
                p = pathArr[i];
            }
            else{
                p += '/' + pathArr[i];
            }
            if(!fs.existsSync(p)){
                fs.mkdirSync(p);
            }
        }
    }
    res.send(p);
}

function file(req, res){
    //require('../appconfig').qr.path
    //这位同学很懒，还没有更新自己的二维码信息。小技巧，点击“自动生成二维码”，个人空间会根据你的个人信息，自动生成一个二维码。有任何问题发私信给，yjwahah
    var path = require('../appconfig').qr.path ;
    //创建目录
    //require('../Utility/file')().CreatFile(path);
    var Qr = require('../Utility/qr')();
    Qr.GetQrToFile("这位同学很懒，还没有更新自己的二维码信息。小技巧，点击“自动生成二维码”，个人空间会根据你的个人信息，自动生成一个二维码。有任何问题发私信给，yjwahah", path + 'defult.png');

    res.send('ok');
}