/**
 * Created by zlj on 13-11-22.
 */
var RedisClent = require('../Utility/Redis')();
var strHelper = require('../Utility/StringHelper')();

module.exports.autoroute = {
    post: {
         '/userercode/getbycsdnid' : getbycsdnid
        , '/userercode/getbyusername' : getbycsdnid
        //, '/userercode/savebycsdnid' : savebycsdnid    
        //, '/userercode/savebyusername' : savebyusername
        , '/userercode/refreshbycsdnid' : refreshbycsdnid
        , '/userercode/refreshbyusername' : refreshbycsdnid
    }
};
var defultCodeUrl = require('../appconfig').qr.saveUrl + 'defult.png';
function getbycsdnid(req, res){
    var CSDNID = req.body.csdnid;
    if(!CSDNID){
        res.send('{"err":98, "msg":"缺少csdnid参数"}');
    }
    else{
        var jsonResult = {};
        //先从redis中找数据
        RedisClent.get('userinfo_'+CSDNID,function(err, replyStr){
        if(err){//redis异常
            res.send('{err:99, msg:"' + err + '"}');
        }
        if(replyStr){//从redis中取得数据 并返回
            var reply = JSON.parse(replyStr);
            if(reply.QrcodeAttachUrl && reply.QrcodeAttachUrl!=""){
                jsonResult = {err:0,msg:"ok",result:{qrcodeattachurl:strHelper.ConvertStr(reply.QrcodeAttachUrl)}};
                res.send(JSON.stringify(jsonResult));// + require('../appconfig').qr.saveUrl
            }
            else{
                //res.send('{"err": 0, "msg": "ok", "result":{"qrcodeattachurl":"' + defultCodeUrl + '"}}');
                //重新生成
                refreshbycsdnid(req, res);
            }
        }
        else{//从数据库中取得，并且存入redis
                  require('../UCBussiness/userinfo').GetUserInfoByCSDNID(CSDNID.toString()
                        , function(dberr){
                            res.send('{"err":99,"msg":"' + dberr + '"}');
                        }
                        , function(data){
                            if(JSON.stringify(data)==='{}'){
                                res.send('{"err":99,"msg":"没有此用户"}');
                            }
                            else{
                                var data2=JSON.parse(data);
                                if(data2.QrcodeAttachUrl && data2.QrcodeAttachUrl!=""){
                                    RedisClent.set('userinfo_'+CSDNID, JSON.stringify(data));
                                    jsonResult = {err:0,msg:"ok",result:{qrcodeattachurl:strHelper.ConvertStr(data2.QrcodeAttachUrl)}};
                                    res.send(JSON.stringify(jsonResult));// + require('../appconfig').qr.saveUrl
                                }
                                else{
                                    //res.send('{"err": 0, "msg": "ok", "result":{"qrcodeattachurl":"' + defultCodeUrl + '"}}');
                                    //重新生成
                                    refreshbycsdnid(req, res);
                                }
                            }
                        }
                  );
            }
    });
    }
}

function savebycsdnid(req, res){
    var csdnid = req.body.csdnid;
    var qrcodeattachurl = req.body.qrcodeattachurl;
    var key = 'userinfo_' +csdnid;
    if(!csdnid){
        res.send('{"err":98, "msg":"缺少csdnid参数"}');
    }
    else {
        //先从redis中找数据
        RedisClent.get(key,function(err, reply){
        if(err){//redis异常
            //res.send('{"err":0, "msg":"' + err + '"}');
        }
         if(reply){//从redis中取得数据 并返回
                res.send('{"err": 0, "msg": "ok"}');
            }
            else{//从数据库中取得，并且存入redis
                 require('../UCBussiness/userercodeprovider').SaveByCSDNIDModule(csdnid,qrcodeattachurl, function(dberr){
                        res.send('{"err":99, "msg":"' + dberr + '"}');
                    }, function(json){
                        RedisClent.set(key, json);
                        res.send('{"err": 0, "msg": "ok"');
                    });               
            }
    });
    }
}

function savebyusername(req, res){
    var csdnid = req.body.csdnid;
    var username = req.body.username;
    var qrcodeattachurl = req.body.qrcodeattachurl;
    var key = 'userinfo_' +csdnid;
    if(!username){
        res.send('{"err":98, "msg":"缺少username参数"}');
    }
    else {
        //先从redis中找数据
        RedisClent.get(key,function(err, reply){
        if(err){//redis异常
            res.send('{"err":0, "msg":"' + err + '"}');
        }
         if(reply){//从redis中取得数据 并返回
                res.send('{"err": 0, "msg": "ok"}');
            }
            else{//从数据库中取得，并且存入redis
                 require('../UCBussiness/userercodeprovider').SaveByCSDNIDModule(csdnid,qrcodeattachurl, function(dberr){
                        res.send('{"err":99, "msg":"' + dberr + '"}');
                    }, function(json){
                        RedisClent.set(key, json);
                        res.send('{"err": 0, "msg": "ok"');
                    });               
            }
    });
    }
}

function refreshbycsdnid(req, res){
    var CSDNID = req.body.csdnid;
    if(!CSDNID){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else{
        var jsonResult = {};
        var time = require('../Utility/time')();
        var today = new Date();
        var Y = today.getFullYear();
        var M = today.getMonth() + 1;
        var D = today.getDate();
        var filename = 'qr_' + CSDNID.toString() + '_' + time.shorttime() + '.png';
        var path = require('../appconfig').qr.path + Y + '/' + M + '/' + D;
        //创建目录
        require('../Utility/file')().CreatFile(path);
        var url = require('../appconfig').qr.saveUrl + Y + '/' + M + '/' + D + '/' + filename ;//
        RedisClent.get('userinfo_' + CSDNID.toString(),function(err, replystr){
            if(err){
                res.send('{"err":99,"msg":"' + err + '"}');
            }
            else{
                if(replystr){
                    var reply = JSON.parse(replystr);
                    require('../UCBussiness/userercodeprovider').RefreshQr(reply,url,path+'/'+filename,filename,function(err1,qr){
                            if(err1){
                                res.send('{"err":99,"msg":"' + err1 + '"}');
                            }
                            else{
                                reply.QrcodeAttachUrl = qr.QrcodeAttachUrl;
                                reply.QrcodeAttachID = qr.QrcodeAttachID;
                                RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(reply));
                                jsonResult = {err:0,msg:"ok",result:{csdnid:CSDNID,qrcodeattachurl:qr.QrcodeAttachUrl}};
                                res.send(JSON.stringify(jsonResult));//  + require('../appconfig').qr.saveUrl
                            }
                        }
                    );
                }
                else{
                    require('../UCBussiness/userinfo').GetUserInfoByCSDNID(CSDNID.toString()
                        , function(dberr){
                            res.send('{"err":99,"msg":"' + dberr + '"}');
                        }
                        , function(data){
                          require('../UCBussiness/userercodeprovider').RefreshQr(data,url,path+'/'+filename,filename,function(err2,qr){
                            if(err2){
                              res.send('{"err":99,"msg":"' + err2 + '"}');
                            }
                            else{
                              data.QrcodeAttachUrl = qr.QrcodeAttachUrl;
                              data.QrcodeAttachID = qr.QrcodeAttachID;
                              RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(data));
                              jsonResult = {err:0,msg:"ok",result:{csdnid:CSDNID,qrcodeattachurl:qr.QrcodeAttachUrl}};
                              res.send(JSON.stringify(jsonResult));//  + require('../appconfig').qr.saveUrl
                            }
                          });
                        });
                }
            }
        });
    }
}
