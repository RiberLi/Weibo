/**
 * Created by zp on 13-12-3.
 */

var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
var paramshelper = require('../Utility/checkparam')();
var RedisClent = require('../Utility/Redis')();

//保存个性化域名
function savebycsdnid(CSDNID, SelfDomain,pushparams,callbackerr, callback){
    var CheckSql = 'select SelfDomain from userinfo where SelfDomain=@SelfDomain';
    var params = {'SelfDomain': SelfDomain };
    sqlhelper.ExecuteDataTable('uc',CheckSql,params,'r'
        ,function(CheckErr,selfdomaindata){
            if(CheckErr){
                callbackerr(CheckErr);
            }
            else{
                if(selfdomaindata.length>0){
                    callbackerr('已存在此个性化域名');
                }
                else{
                    var sql = 'UPDATE userinfo SET SelfDomain=@SelfDomain WHERE CSDNID=@CSDNID';
                    params.CSDNID = CSDNID;
                    sqlhelper.ExecuteNoQuery("uc", sql, params,function(dberr,ID){
                        if(dberr){
                            callbackerr(dberr);
                        }
                        else{
                            require('../UCBussiness/userinfo').GetUserInfoByCSDNID(CSDNID
                                , function(dberr){
                                }
                                , function(data){
                                    if(data){
                                        if(data){
                                            RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(data));
                                        }

                                    }

                                });
                            //passport数据
                            pushselfdomain(pushparams, SelfDomain);
                            callback(ID);
                        }
                    });
                }
            }
        }
    );

}
function savebycsdnidbyredis(CSDNID, SelfDomain,pushparams,callbackerr, callback){
    require('../UCBussiness/OperateRedis').CheckRedis('selfdomain_', SelfDomain
        , function(err,relpystr){
            if(err){
                callbackerr(err);
            }
            else{
                if(relpystr){
                    callbackerr('已存在此个性化域名');
                }
                else{
                    var sql = 'UPDATE userinfo SET SelfDomain=@SelfDomain WHERE CSDNID=@CSDNID';
                    params.CSDNID = CSDNID;
                    sqlhelper.ExecuteNoQuery("uc", sql, params,function(dberr,ID){
                        if(dberr){
                            callbackerr(dberr);
                        }
                        else{
                            require('../UCBussiness/userinfo').GetUserInfoByCSDNID(CSDNID
                                , function(dberr){
                                }
                                , function(data){
                                    if(data){
                                        if(data){
                                            RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(data));
                                        }

                                    }

                                });
                            callback(ID);
                            //passport数据
                            pushselfdomain(pushparams, SelfDomain);
                            require('../UCBussiness/OperateRedis').ReSetRedis(CSDNID, function(errs,data){});//刷新Ridis
                        }
                    });
                }

            }
        }
    );
    var CheckSql = 'select SelfDomain from userinfo where SelfDomain=@SelfDomain';
    var params = {'SelfDomain': SelfDomain };
    sqlhelper.ExecuteDataTable('uc',CheckSql,params
        ,function(CheckErr,selfdomaindata){
            if(CheckErr){
                callbackerr(CheckErr);
            }
            else{
                if(selfdomaindata.length>0){
                    callbackerr('已存在此个性化域名');
                }
                else{
                    var sql = 'UPDATE userinfo SET SelfDomain=@SelfDomain WHERE CSDNID=@CSDNID';
                    params.CSDNID = CSDNID;
                    sqlhelper.ExecuteNoQuery("uc", sql, params,function(dberr,ID){
                        if(dberr){
                            callbackerr(dberr);
                        }
                        else{
                            require('../UCBussiness/userinfo').GetUserInfoByCSDNID(CSDNID
                                , function(dberr){
                                }
                                , function(data){
                                    if(data){
                                        if(data){
                                            RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(data));
                                        }

                                    }

                                });
                            //passport数据
                            pushselfdomain(pushparams, SelfDomain);
                            callback(ID);
                        }
                    });
                }
            }
        }
    );

}

//保存联系方式
function savedetailbycsdnid(CSDNID, MainMobile,SubMobile,PubEmail,NotifyEmail, pushparams,callbackerr, callback){
    var sql = '';
    var params = {'CSDNID': CSDNID}
    var f = false;
    if(paramshelper.checkParams(MainMobile)){
        sql += 'UPDATE userinfo SET MainMobile=@MainMobile '
        params.MainMobile = MainMobile;
        f = true;
        //同步passport
        pushmobile(pushparams,MainMobile);
    }
    if(paramshelper.checkParams(SubMobile)){
        if(sql === ''){
            sql = 'UPDATE userinfo SET SubMobile=@SubMobile '
        }
        else{
            sql += ' ,SubMobile=@SubMobile'
        }
        params.SubMobile = SubMobile;
        f = true;
    }
    if(paramshelper.checkParams(PubEmail)){
        if(sql === ''){
            sql = 'UPDATE userinfo SET PubEmail=@PubEmail '
        }
        else{
            sql += ' ,PubEmail=@PubEmail'
        }
        params.PubEmail = PubEmail;
        f = true;
    }
    if(paramshelper.checkParams(NotifyEmail)){
        if(sql === ''){
            sql = 'UPDATE userinfo SET NotifyEmail=@NotifyEmail '
        }
        else{
            sql += ' ,NotifyEmail=@NotifyEmail'
        }
        params.NotifyEmail = NotifyEmail;
        f = true;
    }
    if(f === true){
        //有修改信息时UserStatus状态置为未审核
        sql += ',UserStatus=' + require('../appconfig').userstatus.original + ' WHERE CSDNID=@CSDNID'
        sqlhelper.ExecuteNoQuery("uc", sql, params,function(dberr,ID){
            if(dberr){
                callbackerr(dberr);
            }
            else{
                require('../UCBussiness/userinfo').GetUserInfoByCSDNID(CSDNID
                    , function(dberr){
                    }
                    , function(data){
                        RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(data));
                    });
                callback(ID);
            }
        });
    }
    else{
        callback(0);
    }
}

function savecontactbycsdnid(List,username,CSDNID,callback){
    var ContactList = List.contactinfo;
    if(!ContactList){
        callback([]);
        return;
    }
    var Loop = ContactList.length;
    var backinfo = [];
    var time = require('../Utility/time')();
    var contactType = require('../appconfig').contacttype;
    ContactList.forEach(function(contact){
        if(contact.type){
	   
            if(parseInt(contact.contactid) == 0){
                //insert
                if(contact.value){
                    var contactInsertSql = '';
                    var contactParams = {'CSDNID':CSDNID
                        ,'UserName': username
                        , 'ContactValue': contact.value
                        , 'ContactType':contact.type
                        , 'AddDate': time.now()
                    };
                    if(List.clientip){
                        contactInsertSql = 'INSERT INTO usercontact (CSDNID,UserName,ContactValue,ContactType,AddDate,AddIP,Status)'
                            + ' VALUES (@CSDNID,@UserName,@ContactValue,@ContactType,@AddDate,@AddIP,@Status)';
                        contactParams['AddIP'] = List.clientip;
                    }
                    else{
                        contactInsertSql = 'INSERT INTO usercontact (CSDNID,UserName,ContactValue,ContactType,AddDate,AddIP,Status)'
                            + ' VALUES (@CSDNID,@UserName,@ContactValue,@ContactType,@AddDate,@AddIP,@Status)';
                    }
                    contactParams['Status'] = require('../appconfig').businessStauts.normal
                    sqlhelper.ExecuteInsert('uc', contactInsertSql, contactParams
                        ,function(inserterr,ID){
                            if(inserterr){
                                Loop = Loop-1;
                                if(Loop<=0){
                                    callback(backinfo);
                                }
                            }
                            else{
                                Loop = Loop-1;
                                backinfo.push({"contactid":ID,"value":contactParams.ContactValue,"type":contactParams.ContactType});
                                if(Loop<=0){
                                    callback(backinfo);
                                }
                            }
                        }
                    );
                    if(contactType.qq === contact.type){
                        //同步passport的qq信息
                        pushpassport(List,contact.value);
                    }
                }
                else{
                    Loop = Loop-1;
                    if(Loop<=0){
                        callback(backinfo);
                    }
                }
            }
    
            else if(parseInt(contact.contactid) > 0){
                //update
                if(paramshelper.checkParams(contact.value)){
                    var contactUpdateSql = '';
                    var contactParams = {'ContactValue': contact.value
                        , 'ContactID': contact.contactid
                        , 'CSDNID': CSDNID
                    };
                    contactUpdateSql = 'update usercontact set ContactValue=@ContactValue, ContactType=@ContactType '
                        + ' WHERE ContactID=@ContactID and CSDNID=@CSDNID';
                    contactParams['ContactType'] =contact.type;
                    sqlhelper.ExecuteNoQuery('uc', contactUpdateSql, contactParams
                        ,function(inserterr,Count){
                            if(inserterr){
                                Loop = Loop-1;
                                if(Loop<=0){
                                    callback(backinfo);
                                }
                            }
                            else{
                                if(Count>0){
                                    backinfo.push({"contactid":contactParams.ContactID,"value":contactParams.ContactValue,"type":contactParams.ContactType});
                                }
                                Loop = Loop-1;
                                if(Loop<=0){
                                    callback(backinfo);
                                }
                            }
                        }
                    );
                    if(contactType.qq === contact.type){
                        //同步passport的qq信息
                        pushpassport(List,contact.value);
                    }
                }
                else{
                    Loop = Loop-1;
                    if(Loop<=0){
                        callback(backinfo);
                    }
                }
            }
            else{
                Loop = Loop-1;
                if(Loop<=0){
                    callback(backinfo);
                }
            }
        }
    });
}

//个人信息写passport
function pushpassport(params,qq){
    if(true == require("../appconfig").passportdata.push){
            if(params.appname != 'passport'){
                if(qq){
                    var pushparams = {};
                    pushparams["userNameOrEmail"] = params.username;
                    pushparams["qq"] = qq;
                    var hr = require('../Utility/httprequest')();
                    var pushurl = require("../appconfig").passportdata.changeinfo;
                    var token = require("../appconfig").passportdata.TOKEN;
                    hr.getData(pushurl, 'POST', pushparams, token
                        , function(err){
                            //applogger.log('err:' + err);
                            //applogger.log('pushurl:' + pushurl);
                            //applogger.log(pushparams);
                        }
                        , function(body){
                            //applogger.log('body:' + body);
                            //applogger.log('pushurl:' + pushurl);
                            //applogger.log(JSON.stringify(pushparams));
                        }
                    );
                }
            }
    }
}
function pushmobile(params, mainmobile){
    if(true == require("../appconfig").passportdata.push){
            if(params.appname != 'passport'){
                if(mainmobile){
                    var pushparams = {};
                    pushparams["userNameOrEmail"] = params.username;
                    pushparams["mobile"] = mainmobile;
                    var hr = require('../Utility/httprequest')();
                    var pushurl = require("../appconfig").passportdata.changemobile;
                    var token = require("../appconfig").passportdata.TOKEN;
                    hr.getData(pushurl, 'POST', pushparams, token
                        , function(err){
//                            applogger.log('err:' + err);
//                            applogger.log('pushurl:' + pushurl);
//                            applogger.log(pushparams);
                        }
                        , function(body){
//                            applogger.log('body:' + body);
//                            applogger.log('pushurl:' + pushurl);
//                            applogger.log(JSON.stringify(pushparams));
                        }
                    );
                }
            }
    }
}
function pushselfdomain(params, selfdomain){
    if(true == require("../appconfig").passportdata.push){
            if(params.appname != 'passport'){
                if(selfdomain){
                    var pushparams = {};
                    //userName=testreg3&domain=testreg3&isSetdm=0
                    pushparams["userName"] = params.username;
                    pushparams["domain"] = selfdomain;
                    pushparams["isSetdm"] = 1;
                    var hr = require('../Utility/httprequest')();
                    var pushurl = require("../appconfig").passportdata.domain;
                    var token = require("../appconfig").passportdata.TOKEN;
                    hr.getData(pushurl, 'POST', pushparams, token
                        , function(err){
//                            applogger.log('err:' + err);
//                            applogger.log('pushurl:' + pushurl);
//                            applogger.log(pushparams);
                        }
                        , function(body){
//                            applogger.log('body:' + body);
//                            applogger.log('pushurl:' + pushurl);
//                            applogger.log(JSON.stringify(pushparams));
                        }
                    );
                }
            }
    }
}

//获取用户标记
function getusermark(CSDNID, callbackerr, callback){
    var sql = "SELECT * FROM usermark WHERE UserCSDNID=@UserCSDNID";
    var params = {'UserCSDNID': CSDNID};
    sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
        if(dberr){//数据库异常
            callbackerr(dberr);
        }
        else{//正常取回数据
            callback(data);
        }
    });
}

//保存用户标记
function savebymark(CSDNID, params, callbackerr, callback){
    var items = [
        'UserCSDNID',
        'MarkID',
        'MarkName',
        'MarkType',
        'MarkUrl',
        'Markdate',
        'Status'
    ];
    var sql = '';
    var sqlparams = {};
    if(params.markid>0){
        //update
        for(var mark in params){
            for(var i=0 ; i<items.length ; i++){
                if(items[i].toLocaleLowerCase() === mark){
                    if(sql === ''){
                        sql = 'UPDATE usermark set '
                    }
                    else{
                        sql += ',';
                    }
                    sql += items[i] + '=@' + items[i];
                    sqlparams[items[i]] = params[mark];
                }
            }
        }
        sql += ' WHERE MarkID=@MarkID'
        sqlparams['MarkID'] = params.markid;
        sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
                if(dberr){
                    callbackerr(dberr);
                }
                else{
                    if(Count>0){
                        callback(params.markid);
                    }
                    else{
                        callbackerr('保存失败，影响行数为0');
                    }
                }
            }
        );
    }
    else if(params.markid==0){
        //insert
        var fields = '';
        var values = '';
        for(var mark in params){
            for(var i=0 ; i<items.length ; i++){
                if(items[i].toLocaleLowerCase() === mark){
                    if(sql === ''){
                        sql = 'INSERT INTO usermark '
                        fields = '(';
                        values = '(';
                    }
                    else{
                        fields += ',';
                        values += ',';
                    }
                    fields += items[i];
                    values += '@' + items[i]
                    sqlparams[items[i]] = params[mark];
                }
            }
        }
        fields += ',UserCSDNID,UserName,Status,MarkDate)';
        values += ',@UserCSDNID,@UserName,' + require('../appconfig').businessStauts.normal + ',NOW())';
        sqlparams['UserCSDNID'] = CSDNID;
        sqlparams['UserName'] = params.username;
        sql += fields + ' VALUES ' + values;

        sqlhelper.ExecuteInsert('uc', sql, sqlparams, function(dberr, ID){
                if(dberr){
                    callbackerr(dberr);
                }
                else{
                    callback(ID);
                }
            }
        );
    }
    if(sql == ''){
        callbackerr('无效markid');
    }
}

function deletebycsdnid(CSDNID,markid,callback){
    var sql = 'UPDATE usermark set Status=@Status where MarkID=@MarkID '
    var sqlparams = {'MarkID':markid,'UserCSDNID':CSDNID,'Status':require('../appconfig').businessStauts.delete};
    sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
            if(dberr){
                callback(dberr,null);
            }
            else{
                if(Count>0){
                    callback(null, markid);
                }
                else{
                    callback('保存失败影响行数为0', null);
                }
            }
        }
    );
}

function CheckSelfdomain(selfdomain,callback){
    var CheckSql = 'select SelfDomain from userinfo where SelfDomain=@SelfDomain';
    var params = {'SelfDomain': selfdomain };
    sqlhelper.ExecuteDataTable('uc',CheckSql,params,'r'
        ,function(CheckErr,selfdomaindata){
            if(CheckErr){
                callbackerr(CheckErr);
            }
            else{
                if(selfdomaindata.length>0){
                    callback(null, 1);
                }
                else{
                    callback(null, 0);
                }
            }
        }
    );
}
function CheckSelfdomainByRedis(selfdomain,callback){
    RedisClent.get('selfdomain_'+selfdomain//个性化域名
        , function(err, replystr){
            if(err){
                callback(err,null);
            }
            else{
                if(replystr){
                    callback(null, 1);
                }
                else{
                    callback(null, 0);
                }
            }
        }
    );
}

exports.Savebycsdnid = savebycsdnid;
exports.Savedetailbycsdnid = savedetailbycsdnid;
exports.Savecontactbycsdnid = savecontactbycsdnid;
exports.getUserMark = getusermark;
exports.Savebymark = savebymark;
exports.DeleteByCSDNID = deletebycsdnid;
exports.CheckSelfdomainModeule = CheckSelfdomain
