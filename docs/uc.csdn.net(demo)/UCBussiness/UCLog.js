/**
 * Created by Liujunjie on 13-12-6.
 */
var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
var RedisClent = require('../Utility/Redis')();
var UserStatus = require('../appconfig').userstatus;
var logger = require('../Utility/logger.js');

module.exports =  function(clients){
    return function (req, res, next) {
        //处理参数
//        for(var parambody in req.body){
//            req.body = JSON.parse(parambody);
//            break;
//        }
        req.orgParams = {};
        if(req.method == 'POST'){
            req.orgParams = req.body;
        }
        else if(req.method == 'GET'){
            req.orgParams = req.query;
        }

        var urlpath = req.url.toLowerCase();
        if(urlpath.indexOf("?") != -1){
            urlpath = urlpath.substring(0,req.url.indexOf("?"))
        }
        if(urlpath.length>=5 && urlpath.substr(0,5) === '/test'){
            next();
        }
        else if(urlpath === '/userinfo/addbycsdnid'){//邮箱注册，创建用户
            next();
        }
        else if(urlpath === '/userinfo/adduser'){//手机注册，创建用户
	    next();
        }
	else if(urlpath === '/userinfo/adduserinfo'){//Job导入简历接口，username为特殊的job$类型
	    next();
	}
        else{
            var CSDNID = 0;
            var UserName = '';
            if(req.body.csdnid){
                CSDNID = req.body.csdnid;
                userStatus(CSDNID, res
                    , function(num,err){
                        res.send('{"err":' + num + ',"msg":"' + err + '"}');
                    }
                    , function (userinfo){
                        req.body.username = userinfo.UserName;
                        UserName = userinfo.UserName;
                        next();
                    }
                );
            }
            else if(req.body.username){
                UserName = req.body.username;
                require('./userinfo').GetCsdnIDbyUserName(UserName
                    , function(dberr){
                        res.send('{"err":99,"msg":"' + dberr + '"}');
                    }
                    , function(data){
                        if(JSON.stringify(data) === '{}'){
                            res.send('{"err":3,"msg":"没找到对应用户"}');
                        }
                        else{
			    if(data.csdnid){
                            	CSDNID = data.csdnid;
                            	userStatus(CSDNID, res
                                	, function(num,err){
                              	        res.send('{"err":' + num + ',"msg":"' + err + '"}');
                                }, function (userinfo){
                                    	req.body.csdnid = CSDNID;
                                    	next();
                                });
			   }
			   else {
				RedisClent.delete('uname_' + UserName.toLowerCase());
			  	res.send('{"err":10,"msg":"请求发生错误"}');
			   }
                        }
                    });
            }
            else{
                //res.send('{"err":99,"msg":"缺少csdnid或者username参数"}');
                next();
            }
        }

        ucOperateLog(req);

//        //BussinessLog
//        var today = new Date();
//        var Y = today.getFullYear();
//        var M = today.getMonth() + 1;
//        var tablename = '';
//        if(M<10){
//            tablename = 'operatelog_' + Y + '0' + M;
//        }
//        else{
//            tablename = 'operatelog_' + Y + M;
//        }
//        var sql = 'INSERT INTO ' + tablename;
//        var fields = ' (CSDNID,UserName,OperateDate,OperateIP,RequestUrl,RequestParam';
//        var values = ' (@CSDNID,@UserName,@OperateDate,@OperateIP,@RequestUrl,@RequestParam';
//        var paramsBlog = {};
//        paramsBlog['CSDNID'] = CSDNID;
//        paramsBlog['UserName'] = UserName;
//        var time = require('../Utility/time')();
//        paramsBlog['OperateDate'] = time.now();
//        paramsBlog['OperateIP'] = req.ip;
//        paramsBlog['RequestUrl'] = req.url;
//        paramsBlog['RequestParam'] = JSON.stringify(req.body);
//        if(req.body.opercsdnid){
//            if(!isNaN(req.body.opercsdnid)){
//                paramsBlog.OperCSDNID = req.body.opercsdnid;
//                fields += ',OperCSDNID';
//                values += ',@OperCSDNID';
//            }
////                paramsBlog.OperCSDNID = req.body.opercsdnid;
////                fields += ',OperCSDNID';
////                values += ',@OperCSDNID';
//        }
//        if(req.body.operusername){
//            paramsBlog.OperUserName = req.body.operusername;
//            fields += ',OperUserName';
//            values += ',@OperUserName';
//        }
//        if(req.body.operatedes){
//            paramsBlog.OperateDes = req.body.operatedes;
//            fields += ',OperateDes';
//            values += ',@OperateDes';
//        }
//        if(req.body.token){
//            paramsBlog.Token = req.body.token;
//            fields += ',Token';
//            values += ',@Token';
//        }
//        if(req.body.appname){
//            paramsBlog.AppName = req.body.appname;
//            fields += ',AppName';
//            values += ',@AppName';
//        }
//        if(req.body.clientip){
//            paramsBlog.ClientIP = req.body.clientip;
//            fields += ',ClientIP';
//            values += ',@ClientIP';
//        }
//        fields += ')';
//        values += ')';
//        sql = sql + fields + 'VALUES' + values;
//        sqlhelper.ExecuteInsert('ucLog', sql,paramsBlog,function(err,ID){
//        
//        });
    };
};

function ucOperateLog(req,CSDNID,UserName){
        var params = {};
        var time = require('../Utility/time')();
        params['OperateDate'] = time.now();
        params['OperateIP'] = req.ip;
        params['RequestUrl'] = req.url;
        //params['headers'] = JSON.stringify(req.headers);
        params['RequestParam'] = JSON.stringify(req.body);
        if(req.body.opercsdnid){
            if(!isNaN(req.body.opercsdnid)){
                params.OperCSDNID = req.body.opercsdnid;
            }
        }
        if(req.body.operusername){
            params.OperUserName = req.body.operusername;
        }
        if(req.body.operatedes){
            params.OperateDes = req.body.operatedes;
        }
        if(req.body.token){
            params.Token = req.body.token;
        }
        if(req.body.appname){
            params.AppName = req.body.appname;
        }
        if(req.body.clientip){
            params.ClientIP = req.body.clientip;
        }
        logger.info(JSON.stringify(params));
}

//判断用户状态通过csdnid
function userStatus(CSDNID, res, callbackerr, callback){
    RedisClent.get('userinfo_' + CSDNID.toString(),function(err, replystr){
        if(err){
            callbackerr(99, err);
        }
        else{
            if(replystr && replystr!= 'null'){
                var reply = JSON.parse(replystr);
                if(replystr==='{}'){
                    callbackerr(3, '没找到对应用户!');
                }
                else{
                    if(reply.UserStatus === UserStatus.kill){//封杀
                        callbackerr(2, 'kill err');
                    }
                    else if(reply.UserStatus === UserStatus.lock){//锁定
                        callbackerr(1, 'lock err');
                    }
                    else{
                        callback(reply);
                    }
                }
            }
            else{
                require('../UCBussiness/userinfo').GetUserInfoByCSDNID(CSDNID
                    , function(dberr){
                        callbackerr(99, dberr);
                    }
                    , function(data){
                        if(JSON.stringify(data)==='{}'){
                            callbackerr(3, '没找到对应用户!');
                        }
                        else{
                            if(data){
                                RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(data));
                            }

                            if(data.UserStatus === UserStatus.kill){//封杀
                                callbackerr(2, 'kill err');
                            }
                            else if(data.UserStatus === UserStatus.lock){//锁定
                                callbackerr(1, 'lock err');
                            }
                            else{
                                callback(data);
                            }
                        }
                    });
            }
        }
    });
}
