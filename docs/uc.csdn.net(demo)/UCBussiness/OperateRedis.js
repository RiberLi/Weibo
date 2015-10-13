
var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
var RedisClent = require('../Utility/Redis')();

exports.ReSetRedis = function(CSDNID, callback){
    var sql = 'SELECT CSDNID,UserName,NickName,LoginEmail,SelfDomain FROM userinfo WHERE CSDNID=@CSDNID';
    var params = {'CSDNID': CSDNID};

    sqlhelper.ExecuteDataRow('uc',sql,params
        ,function(err,data){
            if(err){
                callback(err,null);
            }
            else{
                if(data){
                    var r = JSON.stringify(data);

                    RedisClent.set('uname_'+ data.UserName.toLowerCase(), r);//,expire
                    if(data.NickName){
                        RedisClent.set('nickname_' + data.NickName, r);//,expire
                    }
                    RedisClent.set('csdnid_' + data.CSDNID, r);
                    if(data.LoginEmail){
                        RedisClent.set('loginemail_' + data.LoginEmail, r);
                    }
                    if(data.SelfDomain){
                        RedisClent.set('selfdomain_' + data.SelfDomain, r);
                    }
                    callback(null,'ok');
                }
                else{
                    callback('没有数据',null);
                }
            }
        }
    );
}

exports.CheckRedis = function(type,typeValue,callback){
    if(typeValue){
        RedisClent.get(type + typeValue
            ,function(err,replystr){
                if(err){
                    callback(err,null);
                }
                else{
                    callback(null,replystr);
                }
            }
        );
    }
    else{
        callback("",null);
    }
}
