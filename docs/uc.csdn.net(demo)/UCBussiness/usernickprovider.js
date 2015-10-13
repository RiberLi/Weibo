/**
 * Created by zlj on 13-11-22.
 */
var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);

var RedisClent = require('../Utility/Redis')();

/*
通过csdnid获取昵称
*/
function GetNickNamebyCSDNIDs(csdnids, callbackerr, callback) {
        var str = "";
        //var sql = "SELECT NickName,CSDNID,UserName FROM userinfo where CSDNID in(@csdnids)";
        var sql = "SELECT NickName,CSDNID,UserName FROM userinfo where CSDNID in("+csdnids+")";
        var params = {'csdnids': csdnids};
        //var key = "nick_";
        sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
            if(dberr){//数据库异常
                callbackerr(dberr);
            }
            else{//正常取回数据 写入redis 并返回
                for(var i=0 ; i < data.length ; i++){
                   var nickname=data[i].NickName;
                   var csdnid = data[i].CSDNID;
                    var username = data[i].UserName;
                    //如果nickname不存在，则用username代替
                    if (!nickname) {
                        nickname = username;
                    }
                    var nicknamejson = '{"csdnid":' + csdnid + ',"username":"'+username+'"'+',"nickname":"' + nickname + '"}';
                    //RedisClent.set(key+csdnid.toString(), nicknamejson);
                    if (str == "") {
                        str = nicknamejson;
                    } else {
                         str += ','+nicknamejson;
                    }
                }
                callback(str);   
            }
        });
}

/*
 更新昵称
 */
function SaveByCSDNID(csdnid,nickname,username,appname,callbackerr, callback){
	
	//var sql = "SELECT count(1) rowscount FROM userinfo where CSDNID=@UserCSDNID And ADDDATE(LastUpNickDate,INTERVAL  90 DAY)>NOW()";
  var params = {'UserCSDNID': csdnid,'NickName':nickname};
 	/** sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
  			if(dberr){//数据库异常
            callbackerr(dberr);
        }
        else{//正常取回数据 写入redis 并返回
        	for(var i=0 ; i < data.length ; i++){
          	rowscount=data[i].rowscount;
         	}
          rowscount=parseInt(rowscount);
          if(rowscount>0){
          	callbackerr("90天内只能修改1次!");
          }
          else
          {
	**/ 
	//获取原昵称
	//删除nickname_nickname.toString()数据
	RedisClent.get('userinfo_' + csdnid.toString(),function(err, replystr){
		if(replystr){
			var nickInfo = JSON.parse(replystr);
			var nickName = nickInfo.NickName;
			//删除缓存
			if(nickName){
				RedisClent.delete('nickname_'+nickName.toString());
			}
		}
	});
	//检查昵称是否可用	 
  CheckNick(nickname, csdnid, function(err,count){
		if(err){
    	callbackerr(err);
    }
    else{
    	if(count>0){
    		callbackerr("此昵称已经存在,无法更新!");
     	}
      else{
     		//修改
      	var sqlupdate = "update userinfo set NickName=@NickName,LastUpNickDate=NOW(),LastUpdateDate=NOW() where CSDNID=@UserCSDNID ";
       	sqlhelper.ExecuteDataTable("uc", sqlupdate, params, function(dberr, data){
        	if(dberr){//数据库异常
          	callbackerr(dberr);
          }
        	else{
        		//回调通知passport
            pushnick(username, nickname,appname);
            callback(true);
         	}
				});
			}
		}
	});
}

function SaveByCSDNIDRedis(csdnid,nickname,username,appname,callbackerr, callback){
    CheckNick(nickname,csdnid
        ,function(err,count){
            if(err){
                callbackerr(err);
            }
            else{
                if(count>0){
                    callbackerr('此昵称已经存在,无法更新!');
                }
                else{
                    var sql = "SELECT count(1) rowscount FROM userinfo where CSDNID=@UserCSDNID And ADDDATE(LastUpNickDate,INTERVAL  90 DAY)>NOW()";
                    var params = {'UserCSDNID': csdnid,'NickName':nickname};
                    sqlhelper.ExecuteDataRow("uc", sql, params
                        , function(dberr, data){
                            if(dberr){//数据库异常
                                callbackerr(dberr);
                            }
                            else{
                                var rowscount = parseInt(data.rowscount);
                                if(rowscount>0){
                                    callbackerr("90天内只能修改1次!");
                                }
                                else{
                                    var sqlupdate = "update userinfo set NickName=@NickName,LastUpNickDate=NOW(),LastUpdateDate=NOW() where CSDNID=@UserCSDNID ";
                                    sqlhelper.ExecuteNoQuery("uc", sqlupdate, params, function(dberr, datas){
                                        if(dberr){//数据库异常
                                            callbackerr(dberr);
                                        }
                                        else
                                        {
                                            callback(true);
                                            require('../UCBussiness/OperateRedis').ReSetRedis(csdnid, function(err,data){});//刷新Ridis
                                            require('../UCBussiness/UpdateUserInfoTime')(csdnid,username);//修改userinfo表更改时间
                                            pushnick(username, nickname,appname);//回调通知passport
                                        }
                                    });
                                }
                            }
                        }
                    );
                }
            }
        }
    );

  }

function CheckSingle(sql,params,CSDNID,callback){
    sqlhelper.ExecuteDataRow("uc", sql, params,'r',  function(err, data){
        if(err){//数据库异常
            callback(err,null);
        }
        else{//正常取回数据
            if(data){
                if(data.CSDNID == CSDNID){
                    callback(null, 0);
                }
                else{
                    callback(null, 1);
                }
            }
            else{
                callback(null, 0);
            }
        }
    });
}

function CheckNick(nickname, CSDNID, callback){
    var rowscount = '';
    var sqlnick = 'SELECT CSDNID FROM userinfo where NickName=@NickName';
    var sqlusername = 'SELECT CSDNID FROM userinfo where UserName=@NickName';
    var params = {'NickName':nickname,'CSDNID':CSDNID};
    var async = require('async');
    async.parallel(
        [
            function(cb){
                CheckSingle(sqlnick,params,CSDNID,cb);
            }
            , function(cb){
            CheckSingle(sqlusername,params,CSDNID,cb);
        }
        ]
        , function (err, results) {
            if(err){
                callback(err,null);
                return;
            }
            else{
                if(results[0]>0){
                    callback(null, 1);
                }
                else if(results[1]>0){
                    callback(null, 1);
                }
                else{
                    callback(null,0);
                }
            }

        });

}

function CheckNickRedis(nickname, CSDNID, callback){
    RedisClent.get('nickname_'+nickname//昵称
        , function(err, replystr){
            if(err){
                callback(err,null);
            }
            else{
                if(replystr){
                    var reply = JSON.parse(replystr);
                    if(reply.CSDNID == CSDNID){
                        callback(null,0);
                    }
                    else{
                        callback(null, 1);
                    }
                }
                else{
                    RedisClent.get('uname_'+nickname.toLowerCase()//username
                        , function(err2, replystr2){
                            if(err2){
                                callback(err2,null);
                            }
                            else{
                                if(replystr2){
                                    var reply2 = JSON.parse(replystr2);
                                    if(reply2.CSDNID == CSDNID){
                                        callback(null,0);
                                    }
                                    else{
                                        callback(null,1);
                                    }
                                }
                                else{
                                    callback(null,0);
                                }
                            }
                        }
                    );
                }
            }
        }
    );

  }

function CheckNickName(nickname,callback){
    RedisClent.get('nickname_'+nickname//昵称
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

  function pushnick(userName,nickName,appname) {
     if(true == require("../appconfig").passportdata.push){
         if (appname != 'passport') {
             if (nickName) {
                 var pushparams = {};
                 pushparams["userNameOrEmail"] = userName;
                 pushparams["nickName"] = nickName;
                 var hr = require('../Utility/httprequest')();
                 var pushurl = require("../appconfig").passportdata.changenick;
                 var token = require("../appconfig").passportdata.TOKEN;
                 hr.getData(pushurl, 'POST', pushparams, token, function(err) {
//                     applogger.log('err:' + err);
//                     applogger.log('pushurl:' + pushurl);
//                     applogger.log(pushparams);
                 }, function(body) {
//                     applogger.log('body:' + body);
//                     applogger.log('pushurl:' + pushurl);
//                     applogger.log(JSON.stringify(pushparams));
                 }
                 );
             }
         }
     }
}

  
exports.SaveByCSDNIDModule = SaveByCSDNID;

exports.GetNickNamebyCSDNIDsModule = GetNickNamebyCSDNIDs;

exports.CheckNickModeule = CheckNick;

exports.CheckNickNameModeule = CheckNickName;




