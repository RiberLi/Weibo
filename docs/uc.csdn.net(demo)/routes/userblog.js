var RedisClent = require('../Utility/Redis')();
var strHelper = require('../Utility/StringHelper')();
var paramHelper = require('../Utility/checkparam')();
var ConTime = require('../Utility/time')();

module.exports.autoroute = {
    post: {
        '/userblog/getbycsdnid' : getbycsdnid  //通过csdnid获取技术博客
        ,'/userblog/getbyusername' : getbycsdnid
        ,'/userblog/savebycsdnid' : savebycsdnid  //通过csdnid保存用户标记
        ,'/userblog/savebyusername' : savebycsdnid
    }
};

function GetBlog(csdnid,callback){
	RedisClent.get('userblog_' + csdnid.toString(),function(err, replystr){
        	if(err){
            		callback(err,null);
        	}
        	else{
            		if(replystr){//从redis中取得数据 并返回
                		var reply = JSON.parse(replystr);
                		callback(null,reply);
            		}
            		else{
                		require('../UCBussiness/userblog').getUserBlog(csdnid, function(dberr){
                	        	callback(dberr,null);
                    		}, function(data){
                        		if(data){
                            			RedisClent.set('userblog_' + csdnid.toString(), JSON.stringify(data));
                            			callback(null,data);
                        		}
                        		else{
                            			callback(null,JSON.parse('[]'));
                        		}
                    		});
            		}
        	}
    	});	
}

function getbycsdnid(req,res){
	var csdnid = req.body.csdnid;
	var username = req.body.username;
	var blogtype = req.body.blogtype;
	if(!csdnid){
		res.send('{"err":101,"msg":"缺少csdnid参数"}');
	}
	else{
		GetBlog(csdnid,function(err,BlogInfo){
			if(BlogInfo){
				var jsonblog = [];
				for(var i=0;i<BlogInfo.length;i++){
					if(!blogtype || blogtype===strHelper.ConvertInt(BlogInfo[i].BlogType)){
						jsonblog.push({
							csdnid:BlogInfo[i].CSDNID,
							username:BlogInfo[i].UserName,
							blogname:BlogInfo[i].BlogName,
							blogtype:BlogInfo[i].BlogType,
							blogurl:BlogInfo[i].BlogUrl,
							updatetime:ConTime.jsDayToStr(BlogInfo[i].UpdateDate)
						});
					}
				}
				res.send(JSON.stringify({err:0,msg:"ok",result:jsonblog}));
			}
			else {
				res.send('{"err": 0, "msg": "ok", "result":[]}');
			}
		});
	}
}

function setParams(req,res){
	var params = {};
    	if(paramHelper.checkParams(req.body.blogname)){
        	params.blogname = req.body.blogname;
    	}
    	if(paramHelper.checkParams(req.body.blogurl)){
        	params.blogurl = req.body.blogurl;
    	}
    	return params;
}

function savebycsdnid(req,res){
	var CSDNID = req.body.csdnid;
	var BlogType = req.body.blogtype;
	var UserName = req.body.username;
	
	if(!CSDNID){
                res.send('{"err":101,"msg":"缺少csdnid参数"}');
        }
	else if(!BlogType){
		res.send('{"err":101,"msg":"缺少blogtype参数"}');
	}
	else {
		require('../UCBussiness/userblog').saveUserBlog(CSDNID,UserName,BlogType, setParams(req) ,function(err){
                	res.send(JSON.stringify({err:99,msg:err}));
            	},function(ID){
                	require('../UCBussiness/userblog').getUserBlog(CSDNID, function(dberr){
                
			}, function(datalist){
                    		RedisClent.set('userblog_' + CSDNID.toString(), JSON.stringify(datalist));
                	});
                	res.send('{"err": 0, "msg": "ok", "result": {"blogid":' + ID + '}}');
			require('../UCBussiness/UpdateUserInfoTime')(CSDNID,UserName);//修改userinfo表更改时间
            	});
	} 
}
