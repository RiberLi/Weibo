/**
 * Created by zp on 13-12-16
 */

var RedisClent = require('../Utility/Redis')();
var strHelper = require('../Utility/StringHelper')();

module.exports.autoroute = {
    post: {
        '/userselfdomain/getbycsdnid' : getbycsdnid  //通过csdnid获取个性化域名
        , '/userselfdomain/getbyusername' : getbycsdnid
        , '/userselfdomain/checkbycsdnid' : checkbycsdnid  //通过csdnid检查个性化域名
        ,'/userselfdomain/checkbyusername' : checkbycsdnid
        ,'/userselfdomain/savebycsdnid' : savebycsdnid  //通过csdnid保存个性化域名
        ,'/userselfdomain/savebyusername' : savebycsdnid
        ,'/userselfdomain/checkselfdomain' : checkselfdomain
    }
};
//通过csdnid获取个性化域名
function getbycsdnid(req,res){
    var CSDNID = req.body.csdnid;
    if(!CSDNID){
        res.send('{"err":99,"msg":"缺少csdnid参数"}');
    }
    else{
        getselfdomain(CSDNID, function(err, data){
                if(err){
                    res.send('{"err":99, "msg":"'+err+'"}');
                }
                else{
                    var exisit = false;
                    if(data){
                        if(data.length>0){
                            exisit = true;
                        }
                    }
                    if(exisit == true){
                        res.send('{"err":0,"msg":"ok", "result": {'
                            + '"selfdomainfix":"' + strHelper.ConvertStr(data) + '"}}');
                    }
                    else{
                        var UserName = req.body.username;
                        res.send('{"err":0,"msg":"ok", "result": {'
                            + '"selfdomainfix":"' + strHelper.ConvertStr(UserName) + '"}}');
                    }
                }
            }
        );
    }
}

//通过csdnid检查个性化域名
function checkbycsdnid(req,res){
    var CSDNID = req.body.csdnid;
    var SelfDomain =req.body.selfdomainfix;

    if(!CSDNID){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else{
        getselfdomain(CSDNID, function(err, data){
                if(err){
                    res.send('{"err":99, "msg":"'+err+'"}');
                }
                else{
                    var domainflag = 'false';
                    if(data){
                        if(data.length>0){
                            domainflag = 'true';
                        }
                    }
                    res.send('{"err":0,"msg":"ok","result": {"result":"'+domainflag+'"}}');
                }
            }
        );
    }
}

//通过csdnid保存个性化域名
function savebycsdnid(req,res){
    var CSDNID = req.body.csdnid;
    var UserName = req.body.username;
    var SelfDomain = req.body.selfdomainfix;
    if(!CSDNID){
        res.send('{"err":99,"msg":"缺少csdnid参数"}');
    }
    if(!SelfDomain){
        res.send('{"err":99,"msg":"缺少selfdomainfix参数"}');
    }
    else{
        getselfdomain(CSDNID, function(err, data){
                if(err){
                    res.send('{"err":99, "msg":"'+err+'"}');
                }
                else{
                    var domainflag = false;
                    if(data){
                        if(data.length>0){
                            domainflag = true;
                        }
                    }
                    if(domainflag == false){
                        require('../UCBussiness/savebycsdnid').Savebycsdnid(CSDNID,SelfDomain,checkparams(req)
                            , function(dberr){
                                res.send('{"err":99,"msg":"' + dberr + '"}');
                            }
                            , function(ID){
                                if(ID>0){
                                    require('../UCBussiness/userinfo').GetUserInfoByCSDNID(CSDNID
                                        , function(dberr){
                                        }
                                        , function(data){
                                            RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(data));
                                        });
                                    res.send('{"err":0,"msg":"ok"}');
                                    require('../UCBussiness/UpdateUserInfoTime')(CSDNID,UserName);//修改userinfo表更改时间
                                }
                                else{
                                    res.send('{"err":99, "msg":"此用户个性化域名修改失败"}');
                                }
                            }
                        );
                    }
                    else{
                        res.send('{"err":99, "msg":"此用户个性化域名已存在,不能修改"}');
                    }
                }
            }
        );
    }
}

function getselfdomain(CSDNID, callback){
    RedisClent.get('userinfo_' + CSDNID.toString(),function(err, replystr){
        if(err){
            callback(err,null);
        }
        else{
            if(replystr){
                var reply = JSON.parse(replystr);
                if(JSON.stringify(reply)==='{}'){
                    callback('查无此人',null);
                }
                else{
                    callback(null,reply.SelfDomain);
                }
            }
            else{
                require('../UCBussiness/userinfo').GetUserInfoByCSDNID(CSDNID
                    , function(dberr){
                        callback(dberr,null);
                    }
                    , function(data){
                        if(JSON.stringify(data)==='{}'){
                            callback('查无此人',null);
                        }
                        else{
                            RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(data));
                            callback(null,data.SelfDomain);
                        }
                    });
            }
        }
    });
}

function checkparams(req){
    var  params = {};
    if(req.body.username){
        params.username = req.body.username;
    }

    if(req.body.appname){
        params.appname = req.body.appname;
    }
    return params;
}

function checkselfdomain(req, res){
    var selfdomain = req.body.selfdomain;
    if (!selfdomain) {
        res.send('{"err":98, "msg":"缺少selfdomain参数"}');
    } else {
        require('../UCBussiness/savebycsdnid').CheckSelfdomainModeule(selfdomain
            , function(err,count) {
                if(err){
                    res.send('{"err": 99, "msg": "'+err+'"}');
                }
                else{
                    if(count>0){
                        res.send('{"err": 0, "msg": "ok","result":{"result":true}}');
                    }
                    else{
                        res.send('{"err": 0, "msg": "ok","result":{"result":false}}');
                    }
                }
            });
    }
}


