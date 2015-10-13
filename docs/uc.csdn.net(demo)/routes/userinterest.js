var RedisClent = require('../Utility/Redis')();
var strHelper = require('../Utility/StringHelper')();
var paramHelper = require('../Utility/checkparam')();

module.exports.autoroute = {
    post:{
         '/userinterest/getbycsdnid' : getbyid//获取自己添加领域
        , '/userinterest/getbyusername': getbyid
	, '/userinterest/getsysbycsdnid' :getsysbyid //获取系统推荐领域
	, '/userinterest/getsysbyusername' :getsysbyid
        , '/userinterest/savebyinterestid': savebyinterestid//保存
        , '/userinterest/savebyinterestiduname': savebyinterestid
        , '/userinterest/delbycsdnid': delbycsdnid//删除自己添加领域
        , '/userinterest/delbyusername': delbycsdnid
	, '/userinterest/delsysbycsdnid': delsysbycsdnid//删除系统推荐领域
        , '/userinterest/delsysbyusername': delsysbycsdnid
    }
};

function getSysInterestByid(CSDNID,UserName,callback){
        RedisClent.get('usersysinterest_' + CSDNID.toString(),function(err, replystr){
        if(err){
            callback(err,null);
        }
        else{
            if(replystr){//从redis中取得数据 并返回
                var reply = JSON.parse(replystr);
                callback(null,reply);
            }
            else{
                require('../UCBussiness/userinterest').GetSysbyIDModule(CSDNID,UserName,
                     function(dberr){
                            callback(dberr,null);
                        }
                    ,function(datalist){
                        if(datalist.length>0){
                            RedisClent.set('usersysinterest_' + CSDNID.toString(), JSON.stringify(datalist));
                        }
                        callback(null,datalist);
                });
            }
        }
    });
}

exports.GetSysInterestByid = getSysInterestByid;

function getsysbyid(req,res){
        var CSDNID = req.body.csdnid;
        var username = req.body.username;
        if(!CSDNID){
                res.send('{"err":99, "msg":"缺少csdnid参数"}');
        }
        else {
                getSysInterestByid(CSDNID,username,function(err,datalist){
                        if(err){
                                res.send('{"err":99, "msg":"' + err + '"}');
                        }
                        else {
                                var jsonUserInterest = [];
                                if(datalist.length>0){
                                        var normal = require('../appconfig').businessStauts.normal;
                                        for(var i=0 ; i < datalist.length ; i++){
                                                if(datalist[i].Status == normal){
                                                        jsonUserInterest.push({
                                                                interestid:datalist[i].InterestID
                                                                ,interestname:strHelper.ConvertStr(datalist[i].InterestName)
                                                                ,fromsystem:datalist[i].FromSystem
                                                        }
                                                        );
                                                }
                                        }
                                }
                                var jsonResult = {err:0,msg:"ok",result:jsonUserInterest};
                                res.send(JSON.stringify(jsonResult));
                        }
                });
        }
}

function getInterestByid(CSDNID,UserName,callback){
	RedisClent.get('userinterest_' + CSDNID.toString(),function(err, replystr){
        if(err){
            callback(err,null);
        }
        else{
            if(replystr){//从redis中取得数据 并返回
                var reply = JSON.parse(replystr);
                callback(null,reply);
            }
            else{
                require('../UCBussiness/userinterest').GetbyIDModule(CSDNID,UserName,
                     function(dberr){
                            callback(dberr,null);
                        }
                    ,function(datalist){
                        if(datalist.length>0){
                            RedisClent.set('userinterest_' + CSDNID.toString(), JSON.stringify(datalist));
                        }
                        callback(null,datalist);
                });
            }
        }
    });
}

exports.GetInterestByid = getInterestByid;

function getbyid(req,res){
	var CSDNID = req.body.csdnid;
	var username = req.body.username;
	if(!CSDNID){
		res.send('{"err":99, "msg":"缺少csdnid参数"}');
	}
	else {
		getInterestByid(CSDNID,username,function(err,datalist){
			if(err){
                    		res.send('{"err":99, "msg":"' + err + '"}');
                	}
			else {
				var jsonUserInterest = [];
                    		if(datalist.length>0){
                        		var normal = require('../appconfig').businessStauts.normal;
                        		for(var i=0 ; i < datalist.length ; i++){
                            			if(datalist[i].Status == normal){
                                			jsonUserInterest.push({
                                         			interestid:datalist[i].InterestID
                                        			,interestname:strHelper.ConvertStr(datalist[i].InterestName)
                                        			,fromsystem:datalist[i].FromSystem
                                    			}
                                			);
                            			}
                        		}
                    		}
                    		var jsonResult = {err:0,msg:"ok",result:jsonUserInterest};
                    		res.send(JSON.stringify(jsonResult));
			}
		});
	}
}

//接收保存兴趣领域详细信息参数
function setInterestInfoParams(req){
    var params = {};
    if(req.body.interestid>=0) {
	params.interestid = req.body.interestid;
    }
    if(req.body.interestname) {
        params.interestname = req.body.interestname;
    }
    params.username = req.body.username;
    return params;
}

function savebyinterestid(req,res){
	var CSDNID = req.body.csdnid;
    	var username = req.body.username;
	var params = setInterestInfoParams(req);
    	if(!CSDNID){
        	res.send('{"err":99, "msg":"缺少csdnid参数"}');
    	}
	else if(params.interestid>=0){

        	require('../UCBussiness/userinterest').SaveByInterestID(CSDNID, params
            		, function(err){
                	res.send('{"err":99,"msg":"' + err + '"}');
            	}
            	, function(ID){
                	require('../UCBussiness/userinterest').GetbyIDModule(CSDNID,username, function(dberr){
                    	//res.send('{err:99, msg:"' + dberr + '"}');
                	}, function(datalist){
                    		RedisClent.set('userinterest_' + CSDNID.toString(), JSON.stringify(datalist));
                	});
			require('../UCBussiness/userinterest').GetSysbyIDModule(CSDNID,username, function(dberr){
                        //res.send('{err:99, msg:"' + dberr + '"}');
                        }, function(datalist){
                                RedisClent.set('usersysinterest_' + CSDNID.toString(), JSON.stringify(datalist));
			});
                	require('../UCBussiness/UpdateUserInfoTime')(CSDNID,username);//修改userinfo表更改时间
                	res.send('{"err": 0, "msg": "ok", "result": {"interestid":' + ID + '}}');
            	});
     	}else{
		res.send('{"err":99, "msg":"缺少interestid参数"}');
	}
}

function delbycsdnid(req,res){
	var CSDNID = req.body.csdnid;
    	var username = req.body.username;
    	var interestid = req.body.interestid;
    	if(!paramHelper.checkParams(CSDNID)){
        	res.send('{"err":99, "msg":"缺少csdnid参数"}');
    	}
    	else if(!paramHelper.checkParams(interestid)){
       		res.send('{"err":99, "msg":"缺少interestid参数"}');
    	}
    	else{
		getInterestByid(CSDNID,username,function(err,data){
			if(err){
                    		res.send('{"err":99, "msg":"'+err+'"}');
                	}
			else {
				var flag = false;
				for(var i=0 ; i<data.length ; i++){
        		                if(data[i].InterestID == interestid
                        		    && data[i].Status==require('../appconfig').businessStauts.normal){
                            			flag = true;
                            			data[i].Status = require('../appconfig').businessStauts.delete;
                            			break;
					}
				}
				if(flag==false){
                        		res.send('{"err":99, "msg":"该用户没有此数据"}');
                    		}
				else { //逻辑删除
					require('../UCBussiness/userinterest').DeleteByCSDNID(CSDNID,interestid,function(dberr,count){
						RedisClent.set('userinterest_' + CSDNID.toString(), JSON.stringify(data));
						res.send('{"err":0,"msg":"ok"}');
						require('../UCBussiness/UpdateUserInfoTime')(CSDNID,username);//修改userinfo表更改时间
					});
				}
                        }
        	});
	}		
}

function delsysbycsdnid(req,res){
        var CSDNID = req.body.csdnid;
        var username = req.body.username;
        var interestid = req.body.interestid;
        if(!paramHelper.checkParams(CSDNID)){
                res.send('{"err":99, "msg":"缺少csdnid参数"}');
        }
        else if(!paramHelper.checkParams(interestid)){
                res.send('{"err":99, "msg":"缺少interestid参数"}');
        }
        else{
                getSysInterestByid(CSDNID,username,function(err,data){
                        if(err){
                                res.send('{"err":99, "msg":"'+err+'"}');
                        }
                        else {
                                var flag = false;
                                for(var i=0 ; i<data.length ; i++){
                                        if(data[i].InterestID == interestid
                                            && data[i].Status==require('../appconfig').businessStauts.normal){
                                                flag = true;
                                                data[i].Status = require('../appconfig').businessStauts.delete;
                                                break;
                                        }
                                }
                                if(flag==false){
                                        res.send('{"err":99, "msg":"该用户没有此数据"}');
                                }
                                else { //逻辑删除
                                        require('../UCBussiness/userinterest').DeleteByCSDNID(CSDNID,interestid,function(dberr,count){
                                                RedisClent.set('usersysinterest_' + CSDNID.toString(), JSON.stringify(data));
                                                res.send('{"err":0,"msg":"ok"}');
                                        });
                                }
                        }
                });
        }
}
