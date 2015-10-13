/**
 * Created by Liujunjie on 13-12-6.
 */

var RedisClent = require('../Utility/Redis')();
var strHelper = require('../Utility/StringHelper')();
var paramHelper = require('../Utility/checkparam')();

module.exports.autoroute = {
    post: {
        '/userprivacy/savebycsdnid' : savebycsdnid
        , '/userprivacy/savebyusername' : savebycsdnid
        , '/userprivacy/getbycsdnid' : getbycsdnid
        , '/userprivacy/getbyusername' : getbycsdnid
        , '/userprivacy/delbycsdnid': deletebycsdnid
        , '/userprivacy/delbyusername': deletebycsdnid
    }
};

//获取保存隐私信息参数
function setPriacyParams(req){
    var params = {};
    if(paramHelper.checkParams(req.body.privacyid)){
        params.privacyid = paramHelper.getParams(req, 'privacyid');
    }
    if(paramHelper.checkParams(req.body.privacyname)){
        params.privacyname = paramHelper.getParams(req, 'privacyname');
    }
    if(paramHelper.checkParams(req.body.appname)){
        params.appname = paramHelper.getParams(req, 'appname');
    }
    if(paramHelper.checkParams(req.body.ispublic)){
        params.ispublic = paramHelper.getParams(req, 'ispublic');
    }
    params.username = req.body.username;
    if(paramHelper.checkParams(req.body.clientip)){
        params.lastupdateip = paramHelper.getParams(req, 'clientip');
    }
    return params;
}

//保存隐私信息
function savebycsdnid(req, res){
    var CSDNID = req.body.csdnid;
    var UserName = req.body.username;
    //var Status=req.body.status
    if(!paramHelper.checkParams(CSDNID)){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else if(!paramHelper.checkParams(req.body.privacyid)){
        res.send('{"err":99, "msg":"缺少privacyid参数"}');
    }
    //else if(!paramHelper.checkParams(req.body.privacyname)){
        //res.send('{"err":99, "msg":"缺少privacyname参数"}');
    //}
    //else if(!paramHelper.checkParams(req.body.appname)){
        //res.send('{"err":99, "msg":"缺少appname参数"}');
    //}
    else{
        var PriacyParams = setPriacyParams(req);
        CanUpdate(CSDNID,PriacyParams
            ,function(ferr,flag){
                if(ferr){
                    res.send('{"err":99,"msg":"' + ferr + '"}');
                }
                else{
                    if(flag == true){
                        require('../UCBussiness/userprivacy').SaveByCSDNID(CSDNID, PriacyParams
                            , function(err){
                                res.send('{"err":99,"msg":"' + err + '"}');
                            }
                            , function(ID){
                                require('../UCBussiness/userprivacy').GetByCSDNID(CSDNID, function(dberr){
                                }, function(data){
                                    RedisClent.set('userprivacy_' + CSDNID.toString(), JSON.stringify(data));
                                });
                                res.send('{"err": 0, "msg": "ok","result":{ "privacyid":' + ID + '}}');
                            }
                        );
                    }
                    else{
                        res.send('{"err":99,"msg":"隐私重复"}');
                    }
                }
            }
        );

    }
}

//判断重复 AppName PrivacyName
function CanUpdate(CSDNID,PriacyParams,callback){
    var flag = true;
    var normal = require('../appconfig').businessStauts.normal;
    //取得此用户所有隐私设置
    getprivacy(CSDNID, function(err,data){
                if(err){
                    //取数据出错 不允许修改
                    callback(err,false);
                }
                else{
                    if(data){
                        var pn = PriacyParams.privacyname;
                        var an = PriacyParams.appname;
                        //是否允许比较
                        var compareflag = false;
                        if(PriacyParams.privacyid>0){
                            var exisit = false;
                            for(var i = 0 ; i<data.length ; i++){
                                if(data[i].PrivacyID == PriacyParams.privacyid && normal == data[i].Status){
                                    //pn = strHelper.ConvertStr(data[i].PrivacyName);
                                    //an = strHelper.ConvertStr(data[i].AppName);
                                    exisit = true;
                                    break;
                                }
                            }
                            if(exisit){
                                for(var et = 0 ; et<data.length ; et++){
                                    if(PriacyParams.privacyid != data[et].PrivacyID){
                                        if(pn==strHelper.ConvertStr(data[et].PrivacyName) && an==strHelper.ConvertStr(data[et].AppName)
                                            && normal == data[et].Status){
                                            flag = false;
                                            break;
                                        }
                                    }
                                }
                                if(flag==true){
                                    callback(null,true);
                                }
                                else{
                                    callback('隐私重复',false);
                                }
                            }
                            else{
                                //不存在的隐私设置，不能修改
                                callback('该用户不存在此隐私设置',false);
                            }
                        }
                        else if(PriacyParams.privacyid==0){
                            for(var et = 0 ; et<data.length ; et++){
                                if(pn==strHelper.ConvertStr(data[et].PrivacyName) && an==strHelper.ConvertStr(data[et].AppName)
                                    && normal == data[et].Status){
                                        flag = false;
                                        break;
                                }
                            }
                            if(flag==true){
                                callback(null,true);
                            }
                            else{
                                callback('隐私重复',false);
                            }
                        }
                        else{
                            callback('无效privacyid!',false);
                        }
                    }
                    else{
                        callback(null,true);//
                    }
                }
            });
}

function getbycsdnid(req, res){
    var CSDNID = req.body.csdnid;
    if(!CSDNID){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else{
        getprivacy(CSDNID
            , function(err,data){
                if(err){
                    res.send('{"err":99, "msg":"' + err + '"}');
                }
                else{
                    if(data){
                        var jsonPrivacy = [];
                        for(var i = 0 ; i<data.length ; i++){
                            if(data[i].Status == require('../appconfig').businessStauts.normal){
                                jsonPrivacy.push({
                                        csdnid:data[i].UserCSDNID
                                        ,privacyid:data[i].PrivacyID
                                        ,privacyname:strHelper.ConvertStr(data[i].PrivacyName)
                                        ,ispublic:strHelper.ConvertInt(data[i].IsPublic)
                                        ,appname:strHelper.ConvertStr(data[i].AppName)
                                    }
                                );
                            }

                        }
                        var jsonResult = {err:0,msg:"ok",result:jsonPrivacy};
                        res.send(JSON.stringify(jsonResult));
                    }
                    else{
                        res.send('{"err": 0, "msg": "ok", "result":[]}');
                    }
                }
            }
        );

    }
}

function getprivacy(CSDNID, callback){
    RedisClent.get('userprivacy_' + CSDNID.toString(),function(err, replystr){
        if(err){
            callback(err,null);
        }
        else{
            if(replystr){//从redis中取得数据 并返回
                var reply = JSON.parse(replystr);
                callback(null,reply);
            }
            else{
                require('../UCBussiness/userprivacy').GetByCSDNID(CSDNID, function(dberr){
                        callback(dberr,null);
                    }
                    , function(data){
                        if(data){
                            RedisClent.set('userprivacy_' + CSDNID.toString(), JSON.stringify(data));
                            callback(null,data);
                        }
                        else{
                            callback(null,JSON.parse('[]'));
                        }
                    }
                );
            }
        }
    });
}

function deletebycsdnid(req, res){
    //{csdnid:13435235, privacyid：1，appname:"space"
    var CSDNID = req.body.csdnid;
    //var Status=req.body.status
    if(!paramHelper.checkParams(CSDNID)){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else if(!paramHelper.checkParams(req.body.privacyid)){
        res.send('{"err":99, "msg":"缺少privacyid参数"}');
    }
    else if(!paramHelper.checkParams(req.body.appname)){
        res.send('{"err":99, "msg":"缺少appname参数"}');
    }
    else{
        var params = setPriacyParams(req);
        getprivacy(CSDNID
            ,function(err,data){
                if(err){
                    res.send('{"err":99, "msg":"'+err+'"}');
                }
                else{
                    var flag = false;
                    for(var i=0 ; i<data.length ; i++){
                        if(data[i].PrivacyID==params.privacyid && data[i].AppName == params.appname
                            && data[i].Status==require('../appconfig').businessStauts.normal){
                            flag = true;
                            data[i].Status = require('../appconfig').businessStauts.delete;
                            break;
                        }
                    }
                    if(flag==false){
                        res.send('{"err":99, "msg":"该用户没有此隐私数据"}');
                    }
                    else{
                        //逻辑删除
                        require('../UCBussiness/userprivacy').DeleteByCSDNID(CSDNID,params.privacyid
                            ,function(showerr,count){
                                if(showerr){
                                    res.send('{"err":99, "msg":"'+showerr+'"}');
                                }
                                else{
                                    RedisClent.set('userprivacy_' + CSDNID.toString(), JSON.stringify(data));
                                    res.send('{"err":0,"msg":"ok"}');
                                }
                            }
                        );
                    }
                }
            }
        );
    }
}
