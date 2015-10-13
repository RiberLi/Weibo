/**
 * Created by Liujunjie on 13-11-22.
 */
var logger = require('../Utility/logger.js');
module.exports = function(CSDNID,UserName){
    if(CSDNID){
        var sql = 'UPDATE userinfo SET LastUpdateDate=@LastUpdateDate,AuditInfoStatus=20 WHERE CSDNID=@CSDNID';
        var time = require('../Utility/time')();
        var params = {'LastUpdateDate':time.now(), 'CSDNID':CSDNID};
        var ConnConfig = require('../config').mysqlconn;
        var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
        //修改数据库
        sqlhelper.ExecuteNoQuery('uc', sql, params
            , function(err, updateID){
                if(err){
                    return;
                }
                else{
		    //字段修改后上报数据
		    if(UserName){
			var pushparams = [];
			pushparams.push({id:UserName,type:'uc',operate:'add'})
			var hr = require('../Utility/httprequest')();
			var pushurl = require("../appconfig").uc_to_rc.push_user;
			var token = require("../appconfig").uc_to_rc.TOKEN;
			hr.getDataBody(pushurl, 'POST', pushparams, token, function(err) {

			},function(body){
				try{
					var data = eval(body);
					if(data.ok === true){
                                        	require('../routes/userinfo').saveuserperfection(CSDNID,UserName,function(err,result){
                                        	});
                                	}
				}catch(exception){
					logger.error(UserName,exception);
				}
			});
		    } 
                    //修改缓存
                    var RedisClent = require('../Utility/Redis')();
                    RedisClent.get('userinfo_' + CSDNID.toString()
                        , function(err,replystr){
                            if(replystr){
                                var reply = JSON.parse(replystr);
                                reply.LastUpdateDate = time.now();
                                RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(reply));
                                return;
                            }
                            else{
                                return;
                            }
                        }
                    );
                }
            }
        );
    }
    else{
        return;
    }
}
