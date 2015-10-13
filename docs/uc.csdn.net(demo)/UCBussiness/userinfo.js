/**
 * Created by Liujunjie on 13-11-28.
 */

var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
var paramHelper = require('../Utility/checkparam')();
var RedisClent = require('../Utility/Redis')();
var UserStatus = require('../appconfig').userstatus;
var fs = require('fs');


function CheckSingle(sql,params,callback){
    if(sql){
        sqlhelper.ExecuteDataTable("uc", sql, params,'r', function(err, data){
            if(err){//数据库异常
                callback(err,null);
            }
            else{//正常取回数据
                if(data){
                    if(data.length>0){
                        callback(null, data.length);
                    }
                    else{
                        callback(null, 0);
                    }
                }
                else{
                    callback(null, 0);
                }
            }
        });
    }
    else{
        callback(null, 0);
    }

}

function getuser(csdnid,username,loginemail,callbackerr,callback){
    var sql = 'SELECT csdnid,username,nickname FROM userinfo WHERE 1=1 ';

    var params = {} ;

    if(username){
        sql += ' and UserName=@UserName';
        params['UserName'] = username;
    }

    if(loginemail){
        sql += ' and CSDNID=@CSDNID';
        params['CSDNID'] = csdnid;
    }

    if(loginemail){
        sql += ' and LoginEmail=@LoginEmail';
        params['LoginEmail'] = loginemail;
    }

    if(params.length == 0){
        callbackerr("参数不能为空。");
    }
    sqlhelper.ExecuteDataRow("uc", sql, params,function(dberr, data){
        if(dberr){
            callbackerr(dberr);
        }
        else{
            if(data){
                callback(data);
            }
            else{
                callback(JSON.parse('{}'));
            }
        }
    });

}

//手机注册检测用户
function checkuniqueuser(CSDNID,UserName,Mobile,callbackerr,callback){
    var sqlCSDNID = 'SELECT CSDNID FROM userinfo WHERE CSDNID=@CSDNID';
    var sqlUserName = 'SELECT CSDNID FROM userinfo WHERE UserName=@UserName';
    var sqlMobile = 'SELECT CSDNID FROM userinfo WHERE MainMobile=@MainMobile';
    var params = {'CSDNID': CSDNID, 'UserName': UserName, 'MainMobile':Mobile};
    var async = require('async');
    async.parallel([
	function(checkcsdnid_cb){
		CheckSingle(sqlCSDNID,params,checkcsdnid_cb);	
	},
	function(checkusername_cb){
		CheckSingle(sqlUserName,params,checkusername_cb);
	},
	function(checkmobile_cb){
		CheckSingle(sqlMobile,params,checkmobile_cb);
	}
    ],function(err,results){
	if(err){
        	callbackerr(err);
        }
        else{
		var temp=true;
		for(var i=0;i<results.length;i++){
			if(results[i]!=0){
				temp=false;
				break;
			}
		}
		if(temp == true){
			callback(0);
		}
		else{
			callback(1);
		}
	}	
    });
}

//邮箱注册检测用户
function checkuser(CSDNID, UserName, LoginEmail, nickname, callbackerr, callback){
    var sqlCSDNID = 'SELECT CSDNID FROM userinfo WHERE CSDNID=@CSDNID';
    var sqlUserName = 'SELECT CSDNID FROM userinfo WHERE UserName=@UserName';
    var sqlLoginEmail = '';
    var sqlNickName = '';
    var sqlNickNameUserName = '';
    var params = {'CSDNID': CSDNID, 'UserName': UserName};
    if(LoginEmail){
        sqlLoginEmail = 'SELECT CSDNID FROM userinfo WHERE LoginEmail=@LoginEmail';
        params['LoginEmail'] = LoginEmail;
    }
    if(nickname){
        sqlNickName = 'SELECT CSDNID FROM userinfo WHERE NickName=@NickName';
        sqlNickNameUserName = 'SELECT CSDNID FROM userinfo WHERE UserName=@NickName';
        params['NickName'] = nickname;
    }
    var async = require('async');
    async.parallel(
        [
            function(cb){
                CheckSingle(sqlCSDNID,params,cb);
            }
            , function(cb){
            CheckSingle(sqlUserName,params,cb);
        }
            , function(cb){
            CheckSingle(sqlLoginEmail,params,cb);
        }
            , function(cb){
            CheckSingle(sqlNickName,params,cb);
        }
            , function(cb){
            CheckSingle(sqlNickNameUserName,params,cb);
        }
        ]
        ,function(err,results){
            if(err){
                callbackerr(err);
            }
            else{
                if(results[0]>0){
                    callback(1);
                }
                else if(results[1]>0){
                    callback(1);
                }
                else if(results[2]>0){
                    callback(1);
                }
                else if(results[3]>0){
                    callback(1);
                }
                else if(results[4]>0){
                    callback(1);
                }
                else{
                    callback(0);
                }
            }
        }
    );
}
//判断是否存在
function checkuserbyredis(CSDNID, UserName, LoginEmail, nickname, callback){
    //require('../UCBussiness/OperateRedis').CheckRedis()
    var async = require('async');
    async.parallel(
        [
            function(cb){
                require('../UCBussiness/OperateRedis').CheckRedis('csdnid_', CSDNID, cb);
            }
            , function(cb){
                require('../UCBussiness/OperateRedis').CheckRedis('uname_', UserName.toLowerCase(), cb);
            }
            , function(cb){
                require('../UCBussiness/OperateRedis').CheckRedis('loginemail_', LoginEmail, cb);
            }
            , function(cb){
                require('../UCBussiness/OperateRedis').CheckRedis('nickname_', nickname, cb);
            }
        ]
        , function (err, results) {
            if(err){
                callback(err,false);
                return;
            }
            else{
                if(results[0]){
                    callback('CSDNID有重复',false);
                }
                else if(results[1]){
                    callback('UserName有重复',false);
                }
                else if(results[2]){
                    callback('LoginEmail有重复',false);
                }
                else if(results[3]){
                    callback('NickName有重复',false);
                }
                else{
                    callback(null,true);
                }
            }

        });
}

//手机注册，插入用户
function insertusermobile(AddParams,callbackerr,callback){
    //CSDNID,UserName,Mobile,NickName
    var time = require('../Utility/time')();
    var sql = 'INSERT INTO userinfo ( CSDNID,UserName,NickName,UserStatus,UserType,LastUpdateDate,CreateDate,FromSystem'
    sql += ',AuditEduStatus,AuditSkillStatus,AuditWorkStatus,AuditInfoStatus';
    var values = 'VALUES ( @CSDNID,@UserName,@NickName,' + UserStatus.original + ',1,@now,@now,@FromSystem'
    values += ',@AuditEduStatus,@AuditSkillStatus,@AuditWorkStatus,@AuditInfoStatus';
    var fromSys = 'Push';
    if(typeof(AddParams.NickName) != 'undefined'){
        var NickName = AddParams.NickName;
    } else{
        var NickName = AddParams.UserName
    }
    if(typeof(AddParams.appname) != 'undefined'){
        fromSys = AddParams.appname + 'Push';
    }
    var params = {'CSDNID': AddParams.CSDNID
        , 'UserName': AddParams.UserName
        ,'NickName': NickName
        ,'now': time.now()
        ,'FromSystem': fromSys
        ,'AuditEduStatus':require('../appconfig').AuditEduStatus.notCheckedYet
        ,'AuditSkillStatus':require('../appconfig').AuditSkillStatus.notCheckedYet
        ,'AuditWorkStatus':require('../appconfig').AuditWorkStatus.notCheckedYet
        ,'AuditInfoStatus': require('../appconfig').AuditInfoStatus.validAndUnChecked
    };
    if(AddParams.Mobile){
        sql += ',MainMobile';
        values += ',@MainMobile';
        params['MainMobile'] = AddParams.Mobile;
    }
    sql += ') ' + values + ')';
    sqlhelper.ExecuteInsert("uc", sql, params, function(dberr, UserID){
        if(dberr){
            callbackerr(dberr);
        }
        else{
            callback(UserID);
        }
    });
}	

//邮箱注册，插入用户
function insertuser(AddParams, callbackerr, callback){
    //CSDNID, UserName, LoginEmail, nickname
    var time = require('../Utility/time')();
    var sql = 'INSERT INTO userinfo ( CSDNID,UserName,NickName,UserStatus,UserType,LastUpdateDate,CreateDate,FromSystem'
    sql += ',AuditEduStatus,AuditSkillStatus,AuditWorkStatus,AuditInfoStatus';
    var values = 'VALUES ( @CSDNID,@UserName,@NickName,' + UserStatus.original + ',1,@now,@now,@FromSystem'
    values += ',@AuditEduStatus,@AuditSkillStatus,@AuditWorkStatus,@AuditInfoStatus';
    var fromSys = 'Push';
    if(typeof(AddParams.NickName) != 'undefined'){
        var NickName = AddParams.NickName;
    } else{
	var NickName = AddParams.UserName
    }
    if(typeof(AddParams.appname) != 'undefined'){
        fromSys = AddParams.appname + 'Push';
    }
    var params = {'CSDNID': AddParams.CSDNID
        , 'UserName': AddParams.UserName
	,'NickName': NickName
        ,'now': time.now()
        ,'FromSystem': fromSys
        ,'AuditEduStatus':require('../appconfig').AuditEduStatus.notCheckedYet
        ,'AuditSkillStatus':require('../appconfig').AuditSkillStatus.notCheckedYet
        ,'AuditWorkStatus':require('../appconfig').AuditWorkStatus.notCheckedYet
        ,'AuditInfoStatus': require('../appconfig').AuditInfoStatus.validAndUnChecked
    };
    if(AddParams.LoginEmail){
        sql += ',LoginEmail';
        values += ',@LoginEmail';
        params['LoginEmail'] = AddParams.LoginEmail;
    }
/**    if(AddParams.NickName){
        sql += ',NickName';
        values += ',@NickName';
       // params['NickName'] = AddParams.NickName;
    }
**/
    sql += ') ' + values + ')';
    sqlhelper.ExecuteInsert("uc", sql, params, function(dberr, UserID){
        if(dberr){
            callbackerr(dberr);
        }
        else{
            callback(UserID);
        }
    });
}
//插入用户
function insertuserbyredis(AddParams, callbackerr, callback){
    //CSDNID, UserName, LoginEmail, nickname
    var time = require('../Utility/time')();
    var sql = 'INSERT INTO userinfo ( CSDNID,UserName,UserStatus,UserType,LastUpdateDate,CreateDate,FromSystem'
    sql += ',AuditEduStatus,AuditSkillStatus,AuditWorkStatus';
    var values = 'VALUES ( @CSDNID,@UserName,' + UserStatus.original + ',1,@now,@now,@FromSystem'
    values += ',@AuditEduStatus,@AuditSkillStatus,@AuditWorkStatus';
    var fromSys = 'Push';
    if(typeof(AddParams.appname) != 'undefined'){
        fromSys = AddParams.appname + 'Push';
    }
    var params = {'CSDNID': AddParams.CSDNID
        , 'UserName': AddParams.UserName
        ,'now': time.now()
        ,'FromSystem': fromSys
        ,'AuditEduStatus':require('../appconfig').AuditEduStatus.notCheckedYet
        ,'AuditSkillStatus':require('../appconfig').AuditSkillStatus.notCheckedYet
        ,'AuditWorkStatus':require('../appconfig').AuditWorkStatus.notCheckedYet
    };
    var redis = {'CSDNID':AddParams.CSDNID,'UserName':AddParams.UserName};
    if(AddParams.LoginEmail){
        sql += ',LoginEmail';
        values += ',@LoginEmail';
        params['LoginEmail'] = AddParams.LoginEmail;
        redis.LoginEmail = AddParams.LoginEmail;
    }
    if(AddParams.NickName){
        sql += ',NickName,LastUpNickDate';
        values += ',@NickName,@now';
        params['NickName'] = AddParams.NickName;
        redis.NickName = AddParams.NickName;
    }
    sql += ') ' + values + ')';
    sqlhelper.ExecuteInsert("uc", sql, params, function(dberr, UserID){
        if(dberr){
            callbackerr(dberr);
        }
        else{
            callback(UserID);
            require('../UCBussiness/OperateRedis').ReSetRedis(AddParams.CSDNID, function(err,data){});//刷新Ridis
        }
    });
}

//封杀用户
function killbycsdnid(CSDNID, callbackerr, callback){
    var sql = 'update userinfo set UserStatus=' + UserStatus.kill + ' where CSDNID=@CSDNID'
    var params = {'CSDNID': CSDNID};
    sqlhelper.ExecuteNoQuery("uc", sql, params, function(dberr, Count){
        if(dberr){
            callbackerr(dberr);
        }
        else{
            callback(Count);
        }
    });
}

//解封多个用户
function killusernames(usernames, callbackerr, callback){
    var us = usernames.split(',');
    var s = '';
    for(var i=0 ; i<us.length ; i++){
        if(i!=0){
            s += ',';
        }
        s += '\'' +  us[i] + '\'';
    }
    var sql = 'update userinfo set UserStatus=' + UserStatus.kill + ' where UserName in ( ' + s + ')'
    var params = {};
    sqlhelper.ExecuteNoQuery("uc", sql, params, function(dberr, Count){
        if(dberr){
            callbackerr(dberr);
        }
        else{
            if(Count>0){
                var selectSql = 'select CSDNID from userinfo where UserName in ( ' + usernames + ')';
                sqlhelper.ExecuteDataTable("uc", selectSql
                    , function(serr,data){
                        if(serr){
                            callback(JSON.parse('[]'));
                        }
                        else{
                            callback(data);
                        }
                    }
                );
            }
            else{
                callback(JSON.parse('[]'));
            }
        }
    });
}

//解封用户
function revivebycsdnid(usernames, callbackerr, callback){
    var us = usernames.split(',');
    var s = '';
    for(var i=0 ; i<us.length ; i++){
        if(i!=0){
            s += ',';
        }
        s += '\'' +  us[i] + '\'';
    }
    var sql = 'update userinfo set UserStatus=' + UserStatus.checked + ' where UserName in ( ' + s + ')'
    var params = {};
    sqlhelper.ExecuteNoQuery("uc", sql, params, function(dberr, Count){
        if(dberr){
            callbackerr(dberr);
        }
        else{
            if(Count>0){
                var selectSql = 'select CSDNID from userinfo where UserName in ( ' + s + ')';
                sqlhelper.ExecuteDataTable("uc", selectSql
                    , function(serr,data){
                        if(serr){
                            callback(JSON.parse('[]'));
                        }
                        else{
                            callback(data);
                        }
                    }
                );
            }
            else{
                callback(JSON.parse('[]'));
            }
        }
    });
}

//通过scdnid获取用户信息
function getuserifbycsdnid(CSDNID, callbackerr, callback){
    var sql = 'SELECT * FROM userinfo WHERE CSDNID=@CSDNID';
    var params = {'CSDNID': CSDNID};
    sqlhelper.ExecuteDataRow("uc", sql, params,function(dberr, data){
        if(dberr){
            callbackerr(dberr);
        }
        else{
            if(data){
                //头像处理
                data.AvatarAttachUrl = require('./useravatar').GetAvatarByUsername(data.UserName,require('../appconfig').avatarType.type);
                callback(data);
            }
            else{
                callback(JSON.parse('{}'));
            }
        }
    });
}

//通过userid找用户基本信息
function GetUserByCSDNID(CSDNID,callback){
    RedisClent.get('userinfo_' + CSDNID.toString(),function(err, replystr){
        if(err){
            res.send('{"err":99,"msg":"' + err + '"}');
        }
        else{
            if(replystr){
                var reply = JSON.parse(replystr);
                callback(null,reply);
            }
            else{
                require('./userinfo').GetUserInfoByCSDNID(CSDNID
                    , function(dberr){
                        res.send('{"err":99,"msg":"' + dberr + '"}');
                    }
                    , function(data){
                        RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(data));
                        callback(null,data);
                    });
            }
        }
    });
}

//通过username获取csdnid、nickname等信息并计入缓存
function getcsdnidbyusername(username, callbackerr, callback){
    RedisClent.get('uname_' + username.toLowerCase(), function(err, reply){
        if(err){
            callbackerr(err);
        }
        else{
            if(reply){
                callback(JSON.parse(reply));
            }
            else{
                var sql = 'SELECT csdnid,username,nickname FROM userinfo WHERE UserName=@UserName';
                var params = {'UserName': username};
                sqlhelper.ExecuteDataRow("uc", sql, params,function(dberr, data){
                    if(dberr){
                        callbackerr(dberr);
                    }
                    else{
                        if(data){
                            RedisClent.set('uname_' + username.toLowerCase() , JSON.stringify(data));
                            callback(data);
                        }
                        else{
                            callback(JSON.parse('{}'));
                        }
                    }
                });
            }
        }
    });

}

//通过csdnid获取联系方式
function getusercontactbycsdnid(CSDNID, callbackerr, callback){
    var sql = 'SELECT * FROM usercontact WHERE CSDNID=@CSDNID';
    var params = {'CSDNID': CSDNID};
    sqlhelper.ExecuteDataTable("uc", sql, params,function(dberr, data){
        if(dberr){
            callbackerr(dberr);
        }
        else{
            if(data.length>0){
                callback(data);
            }
            else{
                callback(JSON.parse('[]'));
            }
        }
    });

}


function makeSql(CSDNID, params){
    var items = [
        'RealName',
        'Gender',
        'Birthday',
        'Country',
        'Province',
        'City',
	'District',
        'MaritalStatus',
        'Ethnic',
        'Hukou',
        'WorkStartDate',
        'EduDegreeCode',
        'GraduateSchool',
        'CurCompany',
        'CurJob',
        'SelfDesc',
        'SelfDomain',
        'IndustryType',
        'QrcodeAttachUrl',
        'CityStr',
        'TeamSize',
        'Card',
        'CompanyIntro'
    ];
    var sqlparams = {'CSDNID': CSDNID};
    var sets = [];

    for(var info in params){
        for(var i=0 ; i<items.length ; i++){
            if(info === items[i].toLocaleLowerCase()){
                if(info==='birthday' && params[info]==''){
                    sets.push(items[i] + '=null' );
                }
                else if(info==='workstartdate' && params[info]==''){
                    sets.push(items[i] + '=null' );
                }
                else{
                    sets.push(items[i] + '=@' + items[i]);
                    sqlparams[items[i]] = params[info];
                }

                break;
            }
        }
    }
    return {setlist: sets, sqlparams:  sqlparams};
}

//更新userinfo缓存，callback返回err,userinfo对象
function userinfo_update_redis(CSDNID, callback){
    getuserifbycsdnid(CSDNID
        , function(rediserr){
            callback(rediserr, null);
        }
        , function(userinfo){
            RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(userinfo));
            callback(null, userinfo);
        }
    );
}

//更新usercontact缓存，callback返回err,usercontact数组
function usercontact_update_redis(CSDNID, callback){
    getusercontactbycsdnid(CSDNID
        , function(err){
            callback(err, null);
        }
        , function(contactRedis){
            RedisClent.set('usercontact_' + CSDNID.toString(), JSON.stringify(contactRedis));
            callback(null, contactRedis);
        }
    );
}

//保存用户信息
exports.update_user_info =  function update_user_info(CSDNID, params, callback){
    var sqls = makeSql(CSDNID, params);

    if(sqls.setlist.length == 0){
        callback(null, true);
        return;
    }

    //有修改信息时UserStatus状态置为未审核
    var sql = "UPDATE userinfo SET " + sqls.setlist.join()
        + ',UserStatus=' + require('../appconfig').userstatus.original + ' WHERE CSDNID=@CSDNID';
    //保存个人信息
    sqlhelper.ExecuteNoQuery("uc", sql, sqls.sqlparams, function(dberr, rowcount){
        if(dberr){
            callback(dberr, null);
            return;
        }

        //更新redis缓存
        userinfo_update_redis(CSDNID, function(err, userinfo){
            //写passport
            callback(null, true);
            pushpassport(params);
        });
    });
};

exports.update_user_contact = function update_user_contact(CSDNID, params, callback){
    getuserifbycsdnid(CSDNID
        , function(err){
            callback(err, null);
        }
        , function(userinfo){//仅仅为了获取userName...
            var userName = userinfo.UserName;
            var funcs = [];

            if(params.homepage){
                funcs.push(function(cb){
                    saveHomePage(params, CSDNID, userName, cb);
                });
            }

            if(params.qq){//目前只有刘艳争新增了支持修改单个qq的接口
                funcs.push(function(cb){
                    save_single_contact(params, CSDNID, userName,"qq", cb);
                });
            }

            var async = require('async');
            async.parallel(funcs, function (err, results) {
                if(err){
                    callback(err, null);
                    return;
                }

                //更新redis
                usercontact_update_redis(CSDNID, function(err, result){
                    if(err){
                        callback(err, null);
                        return;
                    }
                    callback(null, true);
                });

            });
        }
    );


};

var get_user_contact = function(CSDNID, callback){
    RedisClent.get('usercontact_' + CSDNID.toString(), function(err, reply){
        if(err){
            callback(err, null);
        }else{
            if(reply){
                callback(null, JSON.parse(reply));
            }
            else{
                require('../UCBussiness/userinfo').GetUserContactByCSDNID(CSDNID
                    ,function(err){
                        callback(err, null);
                    }
                    ,function(result){
                        RedisClent.set('usercontact_' + CSDNID.toString(), JSON.stringify(result));
                        callback(null, result);
                    }
                );
            }
        }
    });
}

function save_single_contact(postbody, CSDNID, userName, contact_type_name, callback){
    var contactValue = postbody[contact_type_name];
    var contactType = require('../appconfig').contacttype[contact_type_name];

    if(contactType.length === 0){
        callback("提交的联系方式参数为空", null);
        return;
    }

    get_user_contact(CSDNID, function(err, result){
        if(err){
            callback(err, null);
            return;
        }

        var contactID = 0;
        if(result && result.length){
            for(var i= 0, len =result.length; i< len; i++){
                if(result[i].ContactType == contactType){
                    contactID = result[i].ContactID;
                    break;
                }
            }
        }

        var sql = ""; var paramDic = {};
        if(contactID > 0){
            sql = "UPDATE usercontact SET ContactValue = @ContactValue  WHERE ContactID=" + contactID;;
            paramDic = {ContactValue: contactValue};
            sqlhelper.ExecuteNoQuery("uc", sql, paramDic, function(err, row){
                callback(err, row);
            });
        }else{
            sql = 'INSERT INTO usercontact (CSDNID,UserName,ContactType,ContactValue,AddDate,AddIP)'
                + ' VALUES (@CSDNID,@UserName,@ContactType,@ContactValue,now(),@AddIP)';
            paramDic["CSDNID"] = CSDNID;
            paramDic["ContactType"] =  contactType;
            paramDic["UserName"] = userName;
            paramDic['AddIP'] = postbody.clientip;
            paramDic["ContactValue"] = contactValue;
            sqlhelper.ExecuteNoQuery("uc", sql, paramDic, function(err, row){
                callback(err, row);
            });
        }
    });
}

//修改个人主页
function saveHomePage(paramsStr, CSDNID, UserName, callback){
    var params = paramsStr.homepage;//JSON.parse(paramsStr.homepage)
    if(typeof(params) == "string"){
        save_single_contact(paramsStr, CSDNID, UserName,"homepage", callback);
        return;
    }else if(params.constructor == Array){
        var homeLoop = params.length;
        var time = require('../Utility/time')();
        var contactType = require('../appconfig').contacttype;
        for(var h=0 ; h<params.length ; h++){
            if(0 === params[h].contactid){
                //insert
                if(params[h].value){
                    var homepageInsertSql = '';
                    var homepageParams = {'CSDNID':CSDNID
                        , 'UserName':UserName
                        , 'ContactValue': params[h].value
                        , 'AddDate': time.now()
                    };
                    if(paramsStr.clientip){
                        homepageInsertSql = 'INSERT INTO usercontact (CSDNID,UserName,ContactType,ContactValue,AddDate,AddIP)'
                            + ' VALUES (@CSDNID,@UserName,'+contactType.homepage+',@ContactValue,@AddDate,@AddIP)';
                        homepageParams['AddIP'] = paramsStr.clientip;
                    }
                    else{
                        homepageInsertSql = 'INSERT INTO usercontact (CSDNID,UserName,ContactType,ContactValue,AddDate,AddIP)'
                            + ' VALUES (@CSDNID,@UserName,'+contactType.homepage+',@ContactValue,@AddDate,@AddIP)';
                    }
                    sqlhelper.ExecuteNoQuery('uc', homepageInsertSql, homepageParams
                        ,function(inserterr,Count){
                            if(inserterr){
                                homeLoop = homeLoop-1;
                                if(homeLoop<=0){
                                    callback();
                                }
                            }
                            else{
                                homeLoop = homeLoop-1;
                                if(homeLoop<=0){
                                    callback();
                                }
                            }
                        }
                    );
                }
                else{
                    homeLoop = homeLoop-1;
                    if(homeLoop<=0){
                        callback();
                    }
                }
            }
            else if(params[h].contactid>0){
                //update
                if(params[h].value){
                    var homepageUpdateSql = 'update usercontact set ContactValue=@ContactValue '
                        + ' WHERE ContactID=@ContactID';
                    var homepageParams = {'ContactValue': params[h].value
                        , 'ContactID': params[h].contactid
                    };
                    sqlhelper.ExecuteNoQuery('uc', homepageUpdateSql, homepageParams
                        ,function(inserterr,Count){
                            if(inserterr){
                                homeLoop = homeLoop-1;
                                if(homeLoop<=0){
                                    callback();
                                }
                            }
                            else{
                                homeLoop = homeLoop-1;
                                if(homeLoop<=0){
                                    callback();
                                }
                            }
                        }
                    );
                }
                else{
                    homeLoop = homeLoop-1;
                    if(homeLoop<=0){
                        callback();
                    }
                }
            }
            else{
                homeLoop = homeLoop-1;
                if(homeLoop<=0){
                    callback();
                }
            }
        }
    }else{
        callback("homepage参数类型错误", null);
        return;
    }
}

//保存登录邮箱
function saveloginemail(CSDNID, LoginEmail, callbackerr, callback){
    var sql = 'update userinfo set LoginEmail=@LoginEmail where CSDNID=@CSDNID'
    var params = {'CSDNID': CSDNID, 'LoginEmail': LoginEmail};
    sqlhelper.ExecuteNoQuery("uc", sql, params, function(dberr, Count){
        if(dberr){
            callbackerr(dberr);
        }
        else{
            callback(Count);
        }
    });
}
function saveloginemailbyredis(CSDNID, LoginEmail, callbackerr, callback){
    RedisClent.get('loginemail_'+ LoginEmail
        ,function(err,replystr){
            if(err){
                callbackerr(err);
            }
            else{
                var change = true;
                if(replystr){
                    var reply = JSON.parse(replystr);
                    if(reply.CSDNID != CSDNID){
                        change = false;
                    }
                }
                if(change){
                    var sql = 'update userinfo set LoginEmail=@LoginEmail where CSDNID=@CSDNID'
                    var params = {'CSDNID': CSDNID, 'LoginEmail': LoginEmail};
                    sqlhelper.ExecuteNoQuery("uc", sql, params, function(dberr, Count){
                        if(dberr){
                            callbackerr(dberr);
                        }
                        else{
                            callback(Count);
                            require('../UCBussiness/OperateRedis').ReSetRedis(CSDNID, function(err,data){});//刷新Ridis
                        }
                    });
                }
                else{
                    callbackerr('邮箱重复，不能更改！');
                }
            }
        }
    );

}

//个人信息写passport
function pushpassport(params){
    if(true == require("../appconfig").passportdata.push){

    if(params.appname != 'passport'){
                var pushparams = {};
                pushparams["userNameOrEmail"] = params.username;
                if(params.city){
                    var c = global.sharecode.GetCodeSync(31, params.city);
                    if(c){
                        pushparams["city"] = c.CodeNameCn;
                    }
                }
                if(paramHelper.checkParams(params.curjob)){
                    pushparams["job"] = params.curjob;
                }
                if(params.industrytype){
                    //pushparams["industry"] = params.industrytype;
                    var d = global.sharecode.GetCodeSync(1, params.industrytype);
                    if(d){
                        pushparams["industry"] = d.CodeNameCn;
                    }
                }
                if(params.workstartdate){
                    //params.workstartdate
                    var today = new Date();
                    var Y = today.getFullYear();
                    var workdate = new Date(params.workstartdate);
                    var wY = workdate.getFullYear();
                    //学生/一年/二年/三年/三年到五年/五年到十年/十年以上
                    if((Y-wY)<=0){
                        pushparams["workYears"] = '学生';
                    }
                    else if((Y-wY)==1){
                        pushparams["workYears"] = '一年';
                    }
                    else if((Y-wY)==2){
                        pushparams["workYears"] = '二年';
                    }
                    else if((Y-wY)==3){
                        pushparams["workYears"] = '三年';
                    }
                    else if((Y-wY)>3 && (Y-wY)<5){
                        pushparams["workYears"] = '三年到五年';
                    }
                    else if((Y-wY)>=5 && (Y-wY)<10){
                        pushparams["workYears"] = '五年到十年';
                    }
                    else if((Y-wY)>=10){
                        pushparams["workYears"] = '十年以上';
                    }
                }
                if(params.gender){
                    if(params.gender==1){
                        pushparams["gender"] = 1;
                    }
                    else if(params.gender==2){
                        pushparams["gender"] = 0;
                    }
                }
                if(params.homepage){
                    if(params.homepage.length>0){
                        pushparams["website"] = params.homepage[0].value;
                    }
                }
                if(paramHelper.checkParams(params.selfdesc)){
                    pushparams["description"] = params.selfdesc;
                }
                if(paramHelper.checkParams(params.birthday)){
                    pushparams["birthday"] = params.birthday;
                }
                if(paramHelper.checkParams(params.realname)){
                    pushparams["realname"] = params.realname;
                }
                var hr = require('../Utility/httprequest')();
                var pushurl = require("../appconfig").passportdata.changeinfo;
                var token = require("../appconfig").passportdata.TOKEN;
                hr.getData(pushurl, 'POST', pushparams, token
                    , function(err){
//                        applogger.log('err:' + err);
//                        applogger.log('pushurl:' + pushurl);
//                        applogger.log(pushparams);
                    }
                    , function(body){
//                        applogger.log('body:' + body);
//                        applogger.log('pushurl:' + pushurl);
//                        applogger.log(JSON.stringify(pushparams));
                    }
                );
            }

    }
}

var userStatusOperType = {
    clearName: 10
    , clearNick: 11
    , approve: 20
    , clock: 30
    , unlock: 31
}

exports.save_status_by_csdnids = function(params, cb){
    var userIdsStr = params.csdnids;
    var operType = params.opertype;

    if(!userIdsStr){
        cb("没有找到操作的对象", null);
        return;
    }

    var userIds =userIdsStr.split(',');
    userIds.forEach(function(d){
        var uid = parseInt(d);
        if(isNaN(uid) || uid <= 0){
            cb("没有找到操作的对象", null);
            return;
        }
    });

    var sql = "Update userinfo Set UserStatus=@UserStatus";
    var sqlparams = {};
    switch(operType){
        case userStatusOperType.clearName:
            sql += ", RealName=NULL ";
            sqlparams["UserStatus"] = UserStatus.checked;
            break;
        case userStatusOperType.clearNick:
            sql += ", NickName=Null";
            sqlparams["UserStatus"] = UserStatus.checked;
            break;
        case userStatusOperType.approve:
            sqlparams["UserStatus"] = UserStatus.checked;
            break;
        case userStatusOperType.clock:
            sqlparams["UserStatus"] = UserStatus.lock;
            break;
        case userStatusOperType.unlock:
            sqlparams["UserStatus"] = UserStatus.checked;
            break;
    }

    sql += " Where CSDNID IN (" + userIdsStr + ")";
    sqlhelper.ExecuteNoQuery("uc", sql, sqlparams, function(err, result){
        if(err){
            cb(err, result);
            return;
        }

        for(var i= 0, len=userIds.length; i< len; i++){
            userIds[i] = 'userinfo_' + userIds[i];
        }

        RedisClent.mset(userIds, null, function(err, result){
            if(err){
                cb(err, null);
                return;
            }
            cb(null, result);
        });
    });
};

/**
 * 设置用户审核状态（教育、技能、工作经历）不更新缓存
 * @param {Int} CSDNID
 * @param {Int} type 1:教育、2:技能、3:工作经历
 * @param {Int} status 参见appconfig(AuditWorkStatus,AuditEduStatus,AuditSkillStatus)
 * @param {function(Object, Array)} callback 回调函数
 */
exports.SetUserCheckStatus = function(CSDNID,type,status,callback){
    var sql = 'update userinfo set '
    if(type==1){
        sql += 'AuditEduStatus=';
    }
    else if(type==2){
        sql += 'AuditSkillStatus=';
    }
    else if(type==3){
        sql += 'AuditWorkStatus=';
    }
    else{
        callback('type值不正确',null);
        return;
    }
    sql += status + ' where CSDNID=' + CSDNID;
    var params = {};
    sqlhelper.ExecuteNoQuery('uc',sql,params
        ,function(err,Count){
            if(err){
                callback(err,null);
            }
            else{
                callback(err,Count);
            }
        }
    );
}
function getusernamebynick(nickname,callback){
    RedisClent.get('nickname_' + nickname.toString(),function(err, replystr){
        if(err){
            callback(err, null);
        }
        else{
            if(replystr){
                callback(null, replystr);
            }
            else{
                var sql = 'SELECT CSDNID,UserName FROM userinfo WHERE NickName=@NickName';
                var params = {'NickName':nickname};
                sqlhelper.ExecuteDataRow("uc", sql, params,function(dberr, data){
                    if(dberr){
                        callback(null, dberr);
                    }
                    else{
                        if(data){
                            RedisClent.set('nickname_' + nickname.toString() , JSON.stringify(data));
                            callback(null, JSON.stringify(data));
                        }
                        else{
                            callback('没找到对应用户', '');
                        }
                    }
                });
            }
        }
    });
}

function makeSqlStatus(CSDNID,params){

	var items = [
		'AuditEduStatus',
		'AuditWorkStatus',
		'AuditSkillStatus',
		'AuditInfoStatus',
		'UserStatus',
		'VerifiedStatus'
	];

	var sqlparams = {'CSDNID': CSDNID};
	var sets = [];

	for(var info in params){
		
		for(var i=0; i<items.length; i++){
			if(info === items[i].toLocaleLowerCase()){
				 sets.push(items[i] + '=@' + items[i]);
				 sqlparams[items[i]] = params[info];
			}
		}
	}
	
	return {setlist: sets, sqlparams:  sqlparams};
}

function saveuserstarusbycsdnid(CSDNID,params,callbackerr,callback){

	var sqlstatus = makeSqlStatus(CSDNID,params);
	
	if(sqlstatus.setlist.length == 0){
		callback(null, true);
		return;
	}

	var sql = 'UPDATE userinfo SET ' + sqlstatus.setlist.join()
	    + ' WHERE CSDNID=@CSDNID';

	//保存更改的状态
	sqlhelper.ExecuteDataTable("uc", sql, sqlstatus.sqlparams, function(dberr, data){
		
		if(dberr){//数据库异常
			callbackerr(dberr);
		}
		else {
			callback(true);
		}
	});	

}

function saveupdatedatebycsdnid(CSDNID,UpdateDate,callbackerr,callback){

	var sql = 'UPDATE userinfo SET LastUpdateDate=@LastUpdateDate WHERE CSDNID=@CSDNID';
	var sqlparams = {};
	sqlparams["CSDNID"] = CSDNID;
	sqlparams["LastUpdateDate"] = UpdateDate;

	sqlhelper.ExecuteDataTable("uc", sql, sqlparams, function(dberr, data){
		if(dberr){
			callbackerr(dberr);
		}
		else{
			callback(true);
		}
	});

}

function getintegritybycsdnid(CSDNID,callbackerr,callback) {
        var async = require('async');
	async.parallel([
		function(detailinfo_cb){
			//详细资料完整度
			var sql = 'SELECT * FROM userinfo where CSDNID = @CSDNID ';
			var params = {'CSDNID': CSDNID};
			sqlhelper.ExecuteDataRow("uc", sql, params,function(dberr, data){
				if(dberr){
					detailinfo_cb(dberr,null)
				}
				else{
					//基本信息
					var score = {};
					score['csdn'] = 0;
					score['job'] = 0;
					if(data.NickName){
                                		score['csdn'] +=6;
                        		}
                        		if(data.RealName){
                                		score['csdn'] +=8;
						score['job'] +=8;
                        		}
                        		if(data.CurJob){
                                		score['csdn'] +=4;
						score['job'] +=4;
                        		}
                        		if(data.IndustryType){
                                		score['csdn'] +=2;
                        		}
                       			if(data.Country){
                                		score['csdn'] +=4;
						score['job'] +=4;
                        		}
                        		if(data.SelfDesc){
                                		score['csdn'] +=2;
						score['job'] +=2;
                        		}
                        		if(data.Gender){
                                		score['csdn'] +=2;
                        		}
                        		if(data.Birthday){
                                		score['csdn'] +=2;
                        		}
					detailinfo_cb(null,score)				
				}
			});
		},
		function(avatar_cb){
			//头像完整度
			var sql = 'SELECT * FROM userinfo where CSDNID = @CSDNID ';
			var params = {'CSDNID': CSDNID};
			sqlhelper.ExecuteDataRow("uc", sql, params,function(dberr, data){
				if(dberr){
					avatar_cb(dberr,null)
				}
				else {
					data.AvatarAttachUrl = require('./useravatar').GetAvatarByUsername(data.UserName,require('../appconfig').avatarType.type);	
                			var avatar_path = JSON.stringify(data.AvatarAttachUrl);
                        		var path = require('../appconfig').avatar;
                        		var url = "http://avatar.csdn.net";
                        		var res = avatar_path.replace(url,path['path']);
                        		var result = eval(res);
                        		var flag = fs.existsSync(result);
                        		var score = 0;
                        		if(flag == true){
                                		score +=2;
                        		}
					avatar_cb(null,score);
				}
			});
		},
		function(contact_cb){
			//联系方式完整度
			var sql = 'SELECT * FROM userinfo where CSDNID = @CSDNID ';
			var params = {'CSDNID': CSDNID};
			sqlhelper.ExecuteDataRow("uc", sql, params,function(dberr, data){
				if(dberr){
                                        contact_cb(dberr,null)
                                }
				else{
					var score = 0;
					if(data.PubEmail || data.SubMobile){
                                		score = 20;
						contact_cb(null,score)
                        		}
					else {
                               			var sql = "SELECT * FROM usercontact where CSDNID = @CSDNID and Status = @Status and ContactType = 110";
                                		var params = {'CSDNID': CSDNID, 'Status': 0};
                                		sqlhelper.ExecuteDataTable("uc", sql, params,function(dberr, data){
                                        		if(dberr){
                                                		contact_cb(dberr,null);
                                        		}
                                        		else {
								if(JSON.stringify(data) != '[]'){
									score = 20;
								}
								contact_cb(null,score)
							}
						});
					}
				}
			});						
                },
                function(skill_cb){
			//专业技能完整度
			var sql = "SELECT * FROM userskill where CSDNID = @CSDNID and Status = @Status and FromBI=@FromBI ";
                        var params = {'CSDNID': CSDNID, 'Status': 0, 'FromBI':0};
                        sqlhelper.ExecuteDataTable("uc", sql, params,function(dberr, data){
                                if(dberr){
                                        skill_cb(dberr,null);
                                }
                                else {
                                        var score = 0;
                                        if(JSON.stringify(data) != '[]'){
                                                if(data.length>0){
                                                        score +=8;
                                                }
					}
					skill_cb(null,score);
                                        
				}
			});
                },
		function(edu_cb){
			//教育经历完整度
			var sql = "SELECT * FROM useredu where CSDNID = @CSDNID and Status = @Status";
			var params = {'CSDNID': CSDNID,'Status': 0};
			sqlhelper.ExecuteDataTable("uc", sql, params,function(dberr, data){
				if(dberr){
					edu_cb(dberr,null);
				}
				else {
					if(JSON.stringify(data) != '[]'){
						var score = new Array();
						for(var i=0;i<data.length;i++){
							score[i] = 0;
							if(data[i].EduStartDate){
								score[i] = score[i] + 5;
							}
							if(data[i].SchoolName){
								score[i] = score[i] + 5;
                                                        }
                                                        if(data[i].MajorStr){
                                                                score[i] = score[i] + 5;
                                                        }
                                                        if(data[i].Degree){
                                                        	score[i] = score[i] + 5;
                                                        }
						}
						edu_cb(null,Math.max.apply(Math,score))
					}
					else {
						edu_cb(null,0);
					}
				}
			});	
                },
		function(work_cb){
			//工作经历完整度
			var sql = "SELECT * FROM userwork where CSDNID = @CSDNID and Status = @Status";
			var params = {'CSDNID': CSDNID,'Status': 0};
			sqlhelper.ExecuteDataTable("uc", sql, params,function(dberr, data){
				if(dberr){
					work_cb(dberr,null);
				}
				else {
					if(JSON.stringify(data) != '[]'){
                                        	var score = new Array();
                                                for(var i=0;i<data.length;i++){
                                                	score[i] = 0;
                                                        if(data[i].WorkBeginDate){
                 	                                       score[i] = score[i] + 5;
                                                        }
                                                       	if(data[i].OrgName){
                                                        	score[i] = score[i] + 5;
                                                        }
                                                        if(data[i].Job){
                                                        	score[i] = score[i] + 5;
                                                        }
                                                        if(data[i].WorkDesc){
                                                       		score[i] = score[i] + 5;
                                                        }
                                              	}
						work_cb(null,Math.max.apply(Math,score))
                                        }
					else {
						work_cb(null,0)
					}
				}
			});
                }
	],function(err, values) {
		if(err){
			callbackerr(err)
		}
		else {
			var datalist = {};
			var total = 0;
			var job = 0;
			var desc = ['detailinfo','avatar','contact','skill','edu','work'];
			var self_total = [30,2,20,8,20,20]
			for(var i=0;i<values.length;i++){
				if(typeof(values[i]['job']) != "undefined"){
					job +=	values[i]['job']
					total += values[i]['csdn']
					datalist[desc[i]]={"score":values[i]['csdn'],"total":self_total[i]}	
				}
				else {
					total +=values[i];
					job += values[i];
					datalist[desc[i]]={"score":values[i],"total":self_total[i]}
				}
			}
			var data = {};
			data['score'] = datalist;
			data['total'] = total;
			data['total_job'] = Math.floor((job/88)*100);
			callback(data);
		}
	});	

}

function getprofilebycsdnid(UserName,callbackerr,callback){
	var async = require('async');
	async.parallel([
		//调取积分接口获取用户勋章
		function(cb){
			var medal = [];
			var thrift = require('thrift'),
			    ucservice=require('../gen-nodejs/ucService.js');
			var options = {
				protocol: thrift.TBinaryProtocol,
				transport: thrift.TFramedTransport
			}
			var ScoreIp = require("../appconfig").uc_to_score.scoreIP;
			var ScorePort = require("../appconfig").uc_to_score.scorePort;
			var connection2 = thrift.createConnection(ScoreIp, ScorePort, {
                		transport : thrift.TFramedTransport,
                		protocol : thrift.TBinaryProtocol
			});
			connection2.on('error', function(err) {
				cb(err,null);
			});
			var serviceName="ucScore";
        		var mp = new thrift.Multiplexer();
        		var client=mp.createClient(serviceName,ucservice,connection2);
        		var score_type = [203,204,205,206,207,208,209,210,211,212,213,214,301,302,303,304,305,306,307];
        		client.get_scorelevel(UserName,score_type,function(err,response){
				if(!err){
					if(response.err === 0){
						for(var j in response.result){
							var s = response.result[j];
							var data = {}; 
							if(s['score']>0){
								data['type'] = s.type;
								data['score'] = s.score;
								medal.push(data);			
							}
						}
						//获取勋章名称
        					var medal_type = [];
        					for(var k in medal){
                        				var t = medal[k];
							var data = t.type;
							if(data){
                        					medal_type.push(data);
							}
        					}
						client.get_codeinfo(medal_type,function(err,response){
                					if(!err){
                        					if(response.err === 0){
                                					for(var j in response.result){
                                        					var s = response.result[j];
                                        					for(var k in medal){
                                                        				if(s.type === medal[k].type){
                                                                				medal[k].codename = s.codename;
                                                        				}
                                        					}
                                					}
									cb(null,medal);
                        					}
							}
							else{
								cb(err,null);
							}
						});
					}
				}
				else{
					cb(err,null);
				}
			});
		},
		//获取UC用户信息
		function(cb){
       			var sql = 'SELECT username,nickname,selfdesc,curjob FROM userinfo where UserName =@UserName '
        		var params = {'UserName':UserName};
        		sqlhelper.ExecuteDataTable("uc", sql, params,function(dberr, userinfodata){
                		if(dberr){
                        		cb(dberr,null);
                		}
                		else{
					if(userinfodata.length){
                        			var sql = 'SELECT skillname FROM userskill WHERE UserName=@UserName and Status=@Status and FromBI=@FromBI '
                        			var params = {'UserName':UserName,'Status':require('../appconfig').businessStauts.normal,'FromBI':0};
                        			sqlhelper.ExecuteDataTable("uc", sql, params,function(dberr, skilldata){
                                			if(dberr){
                                        			cb(dberr,null);
                                			} 
                                			else {
                                        			var sql = 'SELECT interestname FROM userinterest WHERE UserName=@UserName and Status=@Status and FromSystem=@FromSystem '
                                        			var params = {'UserName':UserName,'Status':require('../appconfig').businessStauts.normal,'FromSystem':0};
                                        			sqlhelper.ExecuteDataTable("uc", sql, params,function(dberr, interestdata){
                                                			if(dberr){
                                                        			cb(dberr,null);
                                                			}
                                                			else {
                                                       				var sql = 'SELECT marktype FROM usermark WHERE UserName=@UserName and Status=@Status '
                                                       				var params = {'UserName':UserName,'Status':require('../appconfig').businessStauts.normal};
                                                       				sqlhelper.ExecuteDataTable("uc", sql, params,function(dberr, resultslist){
                                                               				if(dberr){
                                                                       				cb(dberr,null);
                                                                			}
                                                                			else {
                                                                        			var datalist = {};
												var iscto = false;
												var ispro = false;
												datalist['username'] = UserName;
                                                                        			datalist['avatarurl'] =  require('./useravatar').GetAvatarByUsername(UserName,require('../appconfig').avatarType.type);
                                                                        			for(var k in resultslist){
													if(resultslist[k].marktype === 312){
														iscto = true
													}
													if(resultslist[k].marktype === 315){
                                                                                                               	ispro = true
                                                                                                      	}
													if(iscto === true && ispro === true){
														break;
													}
												}
												datalist['IsCTO'] = iscto;
												datalist['IsPro'] = ispro;
												datalist['selfdesc'] = userinfodata[0].selfdesc;
                                                                       				if(userinfodata[0].nickname){
                                                                             				datalist['nickname'] = userinfodata[0].nickname;
                                                                        			}
                                                                        			else{
                                                                                			datalist['nickname'] = userinfodata[0].username;
                                                                        			}
                                                                       				datalist['curjob'] = userinfodata[0].curjob;
                                                                       				var speciality = [];
                                                                       				if(skilldata.length>0){
                                                                               				for(var i=0;i<skilldata.length;i++){
                                                                                        			if(skilldata[i]){
                                                                                               				speciality.push(skilldata[i]);
                                                                                       				}
                                                                               				}
                                                                       				}
                                                                       				if(interestdata.length>0){
                                                                               				for(var i=0;i<interestdata.length;i++){
                                                                                       				if(interestdata[i])
                                                                                               				speciality.push(interestdata[i]);
                                                                               				}
                                                                       				}
                                                                       				if(speciality.length > 0){
                                                                               				datalist['speciality'] = speciality;
                                                                       				}
                                                                       				else {
                                                                              				datalist['speciality'] = userinfodata[0].selfdesc;
                                                                       				}
												cb(null,datalist)
                                                               				}
                                                       				});
                                                			}
                                        			});
                                			}
						});
					}
					else {
						cb(null,null)
					}
				}
                    	});
                }
	],function(err,results){
		if(err){
			callbackerr(err);
		}
		else{
			var result = results[1];
			if(results[1]){
				result['medal'] = results[0];
			}
			callback(result);
		}
	});
}

function getstatusnotifybycsdnid(CSDNID,callback){
	var sql = 'SELECT * FROM userintegrity where CSDNID = @CSDNID ';
        var params = {'CSDNID': CSDNID};
        sqlhelper.ExecuteDataRow("uc", sql, params,function(dberr, data){
		if(dberr){
			callback(dberr,null)
		}
		else {
			if(!data){
				var datalist = {};
				datalist['CSDNID']=CSDNID;
				datalist['notifystatus']=0;
				callback(null,datalist);
			}
			else{
				callback(null,data);
			}
		}
	});	
}

function notify(UserName,callbackerr,callback){
	var pushparams = {};
	pushparams['args1'] = "恭喜您，您的资料完整度已达到100%，请在个人主页领取C币奖励，<a href=\"http://my.csdn.net/\">立即领取>></a>";
	pushparams['args2'] = "您的资料完整度达到100%，系统奖励您5个C币，请在个人主页领取C币奖励，<a href=\"http://my.csdn.net/\">立即领取>></a>"
	pushparams['username'] = UserName;
	pushparams['type'] = 1234;
	pushparams['fromuser'] = "system";
	var hr = require('../Utility/httprequest')();
	var pushurl = "http://svc-notify.csdn.net/put";
	var token = '';
	hr.getData(pushurl, 'POST', pushparams, token, function(dberr) {
		callbackerr(dberr);
	},function(body) {
		callback(true);
	});
}

function changenotifystatus(CSDNID,callback){
	var sql = 'INSERT INTO userintegrity (CSDNID,notifystatus,CreateDate) VALUES (@CSDNID,@Notifystatus,now()) ';
	var params = {'CSDNID': CSDNID, 'Notifystatus': 1};
        sqlhelper.ExecuteDataRow('uc', sql, params,function(dberr, UserID){
		if(!dberr){
			callback(null,CSDNID)
		}
	});	
}

function adduserinfo(CSDNID,UserName,params,callbackerr,callback){
	var time = require('../Utility/time')();
	var items = ['Gender','Birthday','Country','Province','City','District','MaritalStatus','Ethnic','Hukou','WorkStartDate','EduDegreeCode','GraduateSchool','CurCompany','CurJob','SelfDesc','SelfDomain','TeamSize','Card','CompanyIntro','RealName','NickName','PubEmail','IndustryType','SubMobile','NotifyEmail'];
	var sqlparams = {};
	var fields = '';
	var values = '';
	var sql = 'INSERT INTO userinfo '
	fields = '(CSDNID,UserName,NickName,UserStatus,UserType,LastUpdateDate,CreateDate,FromSystem,AuditEduStatus,AuditSkillStatus,AuditWorkStatus,AuditInfoStatus';
	values = '(@CSDNID,@UserName,@NickName,@UserStatus,@UserType,@LastUpdateDate,@CreateDate,@FromSystem,@AuditEduStatus,@AuditSkillStatus,@AuditWorkStatus,@AuditInfoStatus';
	for(var info in params){
		for(var i=0; i<items.length;i++){
			if(items[i].toLocaleLowerCase() === info){
				fields += ',';
				values += ',';
				fields += items[i];
				values += '@' + items[i]
				sqlparams[items[i]] = params[info];
			}
		}
	}
	fields += ')';
	values += ')';
	sqlparams['CSDNID'] = CSDNID;
	sqlparams['UserName'] = UserName;
	if(typeof(sqlparams['NickName']) != 'undefined'){
		var NickName = sqlparams['NickName'];
	}
	else {
		var NickName = UserName;
	}
	sqlparams['NickName'] = NickName;
	sqlparams['UserStatus'] = require('../appconfig').userstatus.original;
	sqlparams['UserType'] = 1;
	sqlparams['LastUpdateDate'] = time.now();
	sqlparams['CreateDate'] = time.now();
	sqlparams['FromSystem'] = 'Job';
	sqlparams['AuditEduStatus'] = require('../appconfig').AuditEduStatus.notCheckedYet; 
	sqlparams['AuditSkillStatus'] = require('../appconfig').AuditSkillStatus.notCheckedYet;
	sqlparams['AuditWorkStatus'] = require('../appconfig').AuditWorkStatus.notCheckedYet;
	sqlparams['AuditInfoStatus'] =  require('../appconfig').AuditInfoStatus.validAndUnChecked;
	sql += fields + ' VALUES ' + values;
	sqlhelper.ExecuteInsert('uc', sql, sqlparams, function(dberr, UserID){
		if(dberr){
            		callbackerr(dberr);
        	}
        	else{
            		callback(UserID);
        	}
	});
}

function checkusernameemail(username,email,callbackerr,callback){
	var sql="SELECT CSDNID from userinfo where UserName=@UserName and PubEmail=@PubEmail ";
	var params = {'UserName':username,'PubEmail':email};
 	sqlhelper.ExecuteDataRow("uc", sql, params,function(dberr, data){
		if(dberr){
			callbackerr(dberr);
		}
		else {
			if(data){
				callback(true);
			}
			else {
				callback(false);
			}
		}
	});	
}

function insertperfection(CSDNID,UserName,perfection,callbackerr,callback){
	var time = require('../Utility/time')();
	var sql = "INSERT INTO userperfection (CSDNID,UserName,perfection,LastUpdateDate) VALUES (@CSDNID,@UserName,@perfection,@LastUpdateDate) ";
	var params = {'CSDNID':CSDNID,'UserName':UserName,'perfection':perfection,'LastUpdateDate':time.now()}
	sqlhelper.ExecuteInsert('uc', sql, params, function(dberr, UserID){
		if(dberr){
			callback(false);
		}
		else {
			callback(true);
		}
	}); 
}

function deleteperfection(CSDNID,callbackerr,callback){
	var sql = "DELETE FROM userperfection WHERE CSDNID=@CSDNID ";
	var params = {'CSDNID':CSDNID};
	sqlhelper.ExecuteDataRow("uc", sql, params,function(dberr, data){
		if(dberr){
			callback(false);
		}
		else {
			callback(true);
		}
	});
}

function usernamesbyperfection(pagesize,pageno,callbackerr,callback){
	var sql = 'SELECT username FROM userperfection WHERE perfection>70 order by LastUpdateDate desc ' +'LIMIT ' + (pageno-1)*pagesize + ',' + pagesize;
	var params = {};
	sqlhelper.ExecuteDataTable("uc", sql, params,function(dberr, data){
                if(dberr){
                        callbackerr(dberr);
                }
                else {
                        callback(data);
                }
        });
	
}

function checkemailormobile(email,mobile,callbackerr,callback){
	if(!email){
		var sql="SELECT username FROM userinfo where mainmobile=@mainmbile or submobile=@submobile";
		var params = {'mainmobile':mobile,'submobile':mobile};
	}
	else if(!mobile){
		var sql="SELECT username FROM userinfo where loginemail=@loginemail or pubemail=@pubemail";
                var params = {'loginemail':email,'pubemail':email};
	}
	else {
		var sql="SELECT username FROM userinfo where loginemail=@loginemail or pubemail=@pubemail or mainmobile=@mainmbile or submobile=@submobile";
		var params = {'loginemail':email,'pubemail':email,'mainmobile':mobile,'submobile':mobile};
	}
	sqlhelper.ExecuteDataTable("uc", sql, params,function(dberr, data){
		if(dberr){
                        callbackerr(dberr);
                }
                else {
                        if(data.length>0){
				callback(true);
			}
			else{
				callback(false);
			}
                }
        });
}

function gethonourbycsdnid(CSDNID,UserName,callbackerr,callback){
	var async = require('async');
	async.parallel([
		//获取积分系统用户勋章
		function(cb){
			var medal = [];
			var thrift = require('thrift'),
            		    ucservice=require('../gen-nodejs/ucService.js');
			var options = {
				protocol: thrift.TBinaryProtocol,
				transport: thrift.TFramedTransport
			};
			var ScoreIp = require("../appconfig").uc_to_score.scoreIP;
			var ScorePort = require("../appconfig").uc_to_score.scorePort;
			var connection2 = thrift.createConnection(ScoreIp, ScorePort, {
                		transport : thrift.TFramedTransport,
                		protocol : thrift.TBinaryProtocol
        		});
        		connection2.on('error', function(err) {
                		console.log(err);
        		});
			var serviceName="ucScore";
			var mp = new thrift.Multiplexer();
			var client=mp.createClient(serviceName,ucservice,connection2);
			var product_type=[2,3,7];
			client.get_medal(UserName,product_type,function(err,response){
				if(!err){
					if(response.err === 0){
						for(var j in response.result){
                                        		var s = response.result[j];
                                        		var data = {};
                                        		if(s['score']>0){
                                                		data['type'] = s.type;
                                                		data['score'] = s.score;
                                                		medal.push(data);
                                        		}
                                		}
					}
					cb(null,medal)
				}
				else {
					cb(err,null);
				}
			});
		},
		//获取UC系统用户标示
		function(cb){
			require('../routes/usermark').GetUserMark(CSDNID, function(dberr,data){
				if(dberr){
					cb(dberr,null);
				}
				else {
					cb(null,data);
				}	
			});	
		}
	],function(err, values) {
		if(err){
			callbackerr(err);
		}
		else {
			var medal_score = new Array();
			var medal_uc = new Array();
			var medal_total = new Array();
			medal_score = getMedalScore(values[0]);
			medal_uc = getMedalUC(values[1]);
			medal_total = medal_score.concat(medal_uc);
			callback(medal_total)
		}
	});
}

function getMedalScore(medalList){
	var medal = new Array();
	var medal_bbs = new Array();
	for(var i=0;i<medalList.length;i++){
		var tt = medalList[i];
		if(tt.score>0){
			if(tt.type>=203 && tt.type<=213){
				medal_bbs.push(tt.type);
			}
			else{
				if(tt.type==214){
					medal.push('优秀版主');
				}
				if(tt.type==301){
					medal.push('博客专家');
				}
				if(tt.type==302){
					medal.push('博客专栏达人');
				}
				if(tt.type==304){
					medal.push('资深博客作者');
				}
				if(tt.type==305){
					medal.push('微软MVP');
				}
				if(tt.type==306){
					medal.push('博客之星');
				}
				if(tt.type==307){
					medal.push('准博客专家');
				}
				if(tt.type==701){
					medal.push('技术问答导师');
				}
				if(tt.type==702){
					medal.push('技术问答热心人');
				}
			}	
		}
	}
	var max_bbs = Math.max.apply(Math,medal_bbs);
	if(max_bbs>=209){
		medal.push('技术论坛专家');
	}
	else if(max_bbs>=206){
		medal.push('技术论坛牛人');
	}
	else if(max_bbs>=203){
		medal.push('技术论坛达人');
	}

	return medal;
	
}

function getMedalUC(medalList){
	var medal = new Array();
	var flag = false;
	for(var i=0;i<medalList.length;i++){
		if(medal.length === 0){
			if(medalList[i].MarkType === 312 || medalList[i].MarkType === 315){
				medal.push(medalList[i].MarkName)
			}
		}
		else {
			for(var k in medal){
				if(medalList[i].MarkName == medal[k]){
					flag = true;
					break;		
				}
				else {
					flag = false;
				}
			}
			if(flag == false){
				if(medalList[i].MarkType === 312 || medalList[i].MarkType === 315){
                                	medal.push(medalList[i].MarkName)
                        	}
			}
		}
	}
	return medal;
}

exports.GetUser = getuser;
exports.CheckUser = checkuser;
exports.CheckUniqueUser = checkuniqueuser;
exports.InsertUser = insertuser;
exports.InsertUserMobile = insertusermobile;
exports.KillByCsdnID = killbycsdnid;
exports.Revive = revivebycsdnid;
exports.GetUserInfoByCSDNID = getuserifbycsdnid;
exports.GetUserByCSDNID = GetUserByCSDNID;
exports.GetCsdnIDbyUserName = getcsdnidbyusername;
exports.GetUserContactByCSDNID = getusercontactbycsdnid;
exports.SaveLoginEmail = saveloginemail;
exports.KillByUsernames = killusernames;
exports.GetUsernameByNick = getusernamebynick;
exports.update_user_status = saveuserstarusbycsdnid;
exports.SaveUpdateDate = saveupdatedatebycsdnid;
exports.GetIntegrityByCSDNID = getintegritybycsdnid;
exports.GetProfileByid = getprofilebycsdnid;
exports.GetStatusNotifyByCSDNID = getstatusnotifybycsdnid;
exports.Notify = notify;
exports.ChangeNotifyStatus = changenotifystatus;
exports.AddUserInfo = adduserinfo;
exports.CheckUserNameEmail = checkusernameemail;
exports.InsertPerfect = insertperfection;
exports.DeletePerfect = deleteperfection;
exports.UserNameListByPerfection = usernamesbyperfection;
exports.CheckEmailMobile = checkemailormobile;
exports.CheckUnique = CheckSingle;
exports.GetUserHonour = gethonourbycsdnid;
exports.Update_UserInfo_Redis = userinfo_update_redis;
