/**
 * Created by zlj on 13-11-22.
 */
var RedisClent = require('../Utility/Redis')();

module.exports.autoroute = {
    post: {
         '/userfile/getbyattachid' : getbyattachid
        , '/userfile/savebycsdnidurl' : savebycsdnidurl
         , '/userfile/savebyusernameurl' : savebyusernameurl
    }
};

function getbyattachid(req, res){
    var attachid = req.body.attachid;
    var key='userfile_'+attachid;
    if(!attachid){
        res.send('{"err":98, "msg":"缺少attachid参数"}');
    }
    else{
        //先从redis中找数据
        RedisClent.get(key,function(err, reply){
        if(err){//redis异常
            //res.send('{"err":0, "msg":"' + err + '"}');
        }
        if(reply){//从redis中取得数据 并返回
                res.send('{"err":0, "msg": "ok", "result":{' + reply + '}}');
            }
            else{//从数据库中取得，并且存入redis
                 require('../UCBussiness/userfileprovider').GetByAttachIdModule(attachid, function(dberr){
                        res.send('{"err":99, "msg":"' + dberr + '"}');
                    }, function(json){
                        RedisClent.set(key, json);
                        res.send('{"err": 0, "msg": "ok","result": {' + json + '}}');
                    });               
        }
    });
    }
}

function savebycsdnidurl(req, res){
    var csdnid = req.body.csdnid;
    var filename = req.body.filename;
    var fileurl = req.body.fileurl;
    var attachtype = req.body.attachtype;
    var uploadip = req.body.uploadip;
    var username = req.body.username;
    var key = "userfile_" + csdnid;
    
    if(!csdnid){
        res.send('{"err":98, "msg":"缺少csdnid参数"}');
    }
    else if (!filename) {
        res.send('{"err":98, "msg":"缺少filename参数"}');
    }
     else if (!fileurl) {
        res.send('{"err":98, "msg":"缺少fileurl参数"}');
    }
     else if (!attachtype) {
        res.send('{"err":98, "msg":"缺少attachtype参数"}');
    }
    else {
        //先从redis中找数据
        RedisClent.get(key,function(err, reply){
        if(err){//redis异常
            //res.send('{"err":0, "msg":"' + err + '"}');
        }
        require('../UCBussiness/userfileprovider').SaveByCsdnIDUrlModule(csdnid,filename,fileurl,attachtype,uploadip,username, function(dberr){
            res.send('{"err":99, "msg":"' + dberr + '"}');
        }, function(json){
            RedisClent.set(key, json);
            res.send('{"err":0, "msg": "ok","result":{"attachid":'+json+'}}');
        });  
    });
    }
}

function savebyusernameurl(req, res){
    var csdnid = req.body.csdnid;
    var filename = req.body.filename;
    var fileurl = req.body.fileurl;
    var attachtype = req.body.attachtype;
    var uploadip = req.body.uploadip;
    var username = req.body.username;
    var key = "userfile_" + csdnid;
    
    if(!username){
        res.send('{"err":98, "msg":"缺少username参数"}');
    }
    else if (!filename) {
        res.send('{"err":98, "msg":"缺少filename参数"}');
    }
     else if (!fileurl) {
        res.send('{"err":98, "msg":"缺少fileurl参数"}');
    }
     else if (!attachtype) {
        res.send('{"err":98, "msg":"缺少attachtype参数"}');
    }
    else {
        //先从redis中找数据
        RedisClent.get(key,function(err, reply){
        if(err){//redis异常
            //res.send('{"err":0, "msg":"' + err + '"}');
        }
       require('../UCBussiness/userfileprovider').SaveByCsdnIDUrlModule(csdnid,filename,fileurl,attachtype,uploadip,username, function(dberr){
                        res.send('{"err":99, "msg":"' + dberr + '"}');
                    }, function(json){
                        RedisClent.set(key, json);
                        res.send('{"err":0, "msg": "ok","result":{"attachid":'+json+'}}');
                    });    
    });
    }
}

