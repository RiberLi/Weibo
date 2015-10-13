/**
 * Created by Liujunjie on 13-11-28.
 */

var RedisClent = require('../Utility/Redis')();
var strHelper = require('../Utility/StringHelper')();
var ConTime = require('../Utility/time')();
var paramHelper = require('../Utility/checkparam')();
var UserReview = require('../UCBussiness/userreview');
var async = require('async');

module.exports.autoroute = {
	post: {
 		'/userinfo/addbycsdnid' : addbycsdnid   //邮箱注册，创建用户(此时不计入redis缓存)
		,'/userinfo/adduser': adduser  //手机注册，创建用户
    ,'/userinfo/checkemailmobile':checkemailmobile  //注册检测手机号或邮箱是否存在
    ,'/userinfo/killbycsdnid': killbycsdnid //封杀用户
    ,'/userinfo/killbyusername': killbycsdnid
    ,'/userinfo/killbyusernames': killbyusernames
    //,'/userinfo/revivebycsdnids': revivebycsdnid
    ,'/userinfo/revivebyusernames': revivebyusernames//解封用户
    ,'/userinfo/getbycsdnid': getbycsdnid   //	用户基本资料
    ,'/userinfo/getbyusername': getbycsdnid
    ,'/userinfo/getdetailbycsdnid': getdetailbycsdnid   //用户详细信息
    ,'/userinfo/getdetailbyusername': getdetailbycsdnid
    ,'/userinfo/savebycsdnid': savebycsdnid     //保存用户详细信息
    ,'/userinfo/savebyusername': savebycsdnid
    ,'/loginemail/savebycsdnid': saveloginemail
    ,'/loginemail/savebyusername': saveloginemail
    ,'/userstatus/savebycsdnids': updatestatus
    ,'/userinfo/getbynickname': getbynickname
    ,'/userinfo/getuser': getuser
		,'/userinfo/saveuserstatusbyusername':savestatusbycsdnid //保存修改用户审核状态
		,'/userinfo/saveupdatedatebycsdnid':saveupdatedatebycsdnid
		,'/userinfo/saveupdatedatebyusername':saveupdatedatebycsdnid
		,'/userinfo/integritybycsdnid': integritybycsdnid
		,'/userinfo/integritybyusername': integritybycsdnid
		,'/userinfo/getavatarintrobyusernames': getavatarintrobyusernames
		,'/userinfo/getprofilebyusername': getprofilebycsdnid //mini profile 接口
		,'/userinfo/getprofilebycsdnid': getprofilebycsdnid
		,'/userinfo/deleteintegritycachebyusername': deletecachebycsdnid   //通过CSDNID删除完整度缓存 头像修改时调用
		,'/userinfo/deleteintegritycachebycsdnid': deletecachebycsdnid 
		,'/userinfo/adduserinfo': adduserinfo //提供给JOB调用，直接添加用户信息
		,'/userinfo/checkusernameemail': checkusernameemail //passport调用，username和pubemail验证job链接有效性
		,'/userinfo/getusernamesbyperfect': getusernamesbyperfection  //获取完整度超过70%的用户 
		,'/userinfo/checkemailormobile': checkemailormobile//验证用户pubemail，longinemail或者submobile，mainmobile用于job导入简历数据
		,'/userinfo/getuserhonourbycsdnid': gethonourbycsdnid //获取用户荣誉提供给Job
		,'/userinfo/getuserhonourbyusername': gethonourbycsdnid //获取用户荣誉提供给Job
	}
}

function gethonourbycsdnid(req,res){
	var CSDNID = req.body.csdnid;
	var UserName = req.body.username;
	if(!CSDNID){
		res.send('{"err":99, "msg":"缺少csdnid参数"}');
	}
	else {
		require('../UCBussiness/userinfo').GetUserHonour(CSDNID,UserName,function(dberr){
			res.send('{err:99, msg:"' + dberr + '"}');
		},function(data){
			var jsonResult = {err:0,msg:"ok",result:data};
                        res.send(JSON.stringify(jsonResult));		
		});	
	}
}

function checkemailmobile(req,res){
	var mobile = req.body.mobile;
	var email = req.body.email;
	var sqlMobile,sqlEmail,params;
	if(!email && !mobile){
                res.send('{"err":99, "msg":"缺少email/mobile参数"}');
        }
	else if(email && mobile){
	        res.send('{"err":99, "msg":"email和mobile不能同时存在"}');	
	}
	else if(mobile){
		sqlMobile = 'SELECT CSDNID FROM userinfo WHERE MainMobile=@MainMobile';
		params = {'MainMobile':mobile};
		require('../UCBussiness/userinfo').CheckUnique(sqlMobile,params,function(dberr,data){
			if(dberr){
				res.send('{err:99, msg:"' + dberr + '"}');
			}
			else{
				if(data==0){
					res.send('{err:0, msg:"ok",result:"true"}');
				}
				else{
					res.send('{err:0, msg:"ok",result:"false"}');
				}
			}
        	});
	}
	else if(email){
		sqlEmail = 'SELECT CSDNID FROM userinfo WHERE LoginEmail=@LoginEmail';
                params = {'LoginEmail':email};
		require('../UCBussiness/userinfo').CheckUnique(sqlEmail,params,function(dberr,data){
                	if(dberr){
                                res.send('{err:99, msg:"' + dberr + '"}');
                        }
                        else{
                                if(data==0){
                                        res.send('{err:0, msg:"ok",result:"true"}');
                                }
                                else{
                                        res.send('{err:0, msg:"ok",result:"false"}');
                                }
                        }
		});
	}
}

function checkemailormobile(req,res){
	var email = req.body.email;
	var mobile = req.body.mobile;
	if(!email && !mobile){
		res.send('{"err":99, "msg":"缺少email/mobile参数"}');
	}
	else{
		require('../UCBussiness/userinfo').CheckEmailMobile(email,mobile,function(dberr){
                        res.send('{err:99, msg:"' + dberr + '"}');
                },function(data){
                        if(data==true){
                                res.send('{err:0, msg:"ok",result:"' +data+'"}');
                        }
                        else {
                                res.send('{err:0, msg:"ok",result:"false"}');
                        }
                });
	}
}


function checkusernameemail(req,res){
	var username = req.body.username;
	var email= req.body.email;
	if(!username){
		res.send('{"err":99, "msg":"缺少username参数"}');
	}
	else if(!email){
		res.send('{"err":99, "msg":"缺少email参数"}');
	}
	else {
		require('../UCBussiness/userinfo').CheckUserNameEmail(username,email,function(dberr){
			res.send('{err:99, msg:"' + dberr + '"}');		
		},function(data){
			if(data==true){
				res.send('{err:0, msg:"ok",result:"' +data+'"}');
			}
			else {
				res.send('{err:0, msg:"ok",result:"false"}');
			}
		});	
	}
}

//接收保存详细信息参数
function UserInfoDetail(req){
    var params = {};
    if(paramHelper.checkParams(req.body.gender)){
        params.gender = req.body.gender;
    }
    if(paramHelper.checkParams(req.body.birthday)){
        params.birthday = req.body.birthday;
    }
    if(paramHelper.checkParams(req.body.country)){
        params.country = req.body.country;
    }
    if(paramHelper.checkParams(req.body.province)){
        params.province = req.body.province;
    }
    if(paramHelper.checkParams(req.body.city)){
        params.city = req.body.city;
    }
    if(paramHelper.checkParams(req.body.district)){
        params.district = req.body.district;
    }
    if(paramHelper.checkParams(req.body.maritalstatus)){
        params.maritalstatus = req.body.maritalstatus;
    }
    if(paramHelper.checkParams(req.body.ethnic)){
        params.ethnic = req.body.ethnic;
    }
    if(paramHelper.checkParams(req.body.hukou)){
        params.hukou = req.body.hukou;
    }
    if(paramHelper.checkParams(req.body.workstartdate)){
        params.workstartdate = req.body.workstartdate;
    }
    if(paramHelper.checkParams(req.body.edudegreecode)){
        params.edudegreecode = req.body.edudegreecode;
    }
    if(paramHelper.checkParams(req.body.graduateschool)){
        params.graduateschool = req.body.graduateschool;
    }
    if(paramHelper.checkParams(req.body.curcompany)){
        params.curcompany = req.body.curcompany;
    }
    if(paramHelper.checkParams(req.body.curjob)){
        params.curjob = req.body.curjob;
    }
    if(paramHelper.checkParams(req.body.selfdesc)){
        params.selfdesc = req.body.selfdesc;
    }
    if(paramHelper.checkParams(req.body.selfdomain)){
        params.selfdomain = req.body.selfdomain;
    }
    if(paramHelper.checkParams(req.body.teamsize)){
        params.teamsize = req.body.teamsize;
    }
    if(paramHelper.checkParams(req.body.card)){
        params.card = req.body.card;
    }
    if(paramHelper.checkParams(req.body.companyintro)){
        params.companyintro = req.body.companyintro;
    }
    if(paramHelper.checkParams(req.body.realname)){
        params.realname = req.body.realname;
    }
    if(paramHelper.checkParams(req.body.nickname)){
        params.nickname = req.body.nickname;
    }
    if(paramHelper.checkParams(req.body.pubemail)){
        params.pubemail = req.body.pubemail;
    }
    if(paramHelper.checkParams(req.body.industrytype)){
        params.industrytype = req.body.industrytype;
    }
    if(paramHelper.checkParams(req.body.submobile)){
        params.submobile = req.body.submobile;
    }
    if(paramHelper.checkParams(req.body.notifyemail)){
        params.notifyemail = req.body.notifyemail;
    }
    return params;
}

//提供给JOB调用，直接添加用户信息
function adduserinfo(req,res){
	var CSDNID = req.body.csdnid;
	var username = req.body.username;
	if(!CSDNID){
		res.send('{"err":99, "msg":"缺少csdnid参数"}');
	}
	else if(!username) {
		res.send('{"err":99, "msg":"缺少username参数"}');
	}
	else {
		var params = UserInfoDetail(req);
		require('../UCBussiness/userinfo').AddUserInfo(CSDNID,username,params,function(dberr){
			res.send('{err:99, msg:"' + dberr + '"}');
		},function(data){
			if(data){
				res.send('{"err":0,"msg":"ok"}');
			}
		});
	}
}

//通过CSDNID删除完整度缓存 头像修改时调用

function deletecachebycsdnid(req,res){
	var CSDNID = req.body.csdnid;
        var UserName = req.body.username;
	if(!CSDNID){
                res.send('{"err":99, "msg":"缺少csdnid参数"}');
        }
        else {
		//判断发送消息
		SendNotify(CSDNID,UserName,function(err,data){

		});
		res.send('{"err":0,"msg":"ok"}');
	}
}

function GetProfile(UserName,callback){
	RedisClent.get('userprofile_' + UserName.toLowerCase(), function(err, replystr){
		if(err){
			callback(err,null)
		}
		else{
			if(replystr){
				var reply = JSON.parse(replystr);
				callback(null,reply);
			}
			else {
				require('../UCBussiness/userinfo').GetProfileByid(UserName,function(dberr){
					callback(dberr,null)
				},function(data){
					if(data){
						RedisClent.set('userprofile_' + UserName.toLowerCase(),JSON.stringify(data),60*60*24);
					}
					callback(null,data)
				});
			}
		}
	});
}

//获取mini profile
function getprofilebycsdnid(req,res){
	var CSDNID = req.body.csdnid;
	var UserName = req.body.username;
	if(!CSDNID){
		res.send('{"err":99, "msg":"缺少csdnid参数"}');
	}
	else {
		GetProfile(UserName,function(err,ProfileInfo){
			if(ProfileInfo){
				var jsonResult = {err:0,msg:"ok",result:ProfileInfo};
			}
			else{
				var jsonResult = {err:0,msg:"ok",result:'[]'};
			}
			res.send(JSON.stringify(jsonResult));
		});
	}
}

function getavatarintrobyusernames(req,res){
	var usernames = req.body.usernames;
	if(!usernames){
        	res.send('{"err":99, "msg":"缺少usernames参数"}');
    	}
    	else{
		var keys = new Array()
		for (var i=0; i<usernames.length; i=i+1) {
         		keys[i] =  'userprofile_' + usernames[i].toLowerCase() ;
    		}
		RedisClent.mget(keys, function(err, reply){
			if(err){
				res.send(JSON.stringify({err:98,msg:err}));
			}
			else{
				var unames = new Array();
				var jsonArr = new Array();
				for (var i=0; i<reply.length; i=i+1) {
					if(reply[i] == null){
						unames.push(usernames[i]);
					}else{
						var result = JSON.parse(reply[i]);
						var data = {'username':result.username,'selfdesc':result.selfdesc,'avatarurl':result.avatarurl};
						jsonArr.push(data)
					}
				}
				if(unames.length > 0){
					var count=unames.length;
					for(var k=0;k<unames.length;k++){
						GetProfile(unames[k],function(err,result){
							if(!err){
								if(result){
									var data = {'username':result.username,'selfdesc':result.selfdesc,'avatarurl':result.avatarurl};
									jsonArr.push(data);
								}
								count--;
								if(count==0){
									var jsonResult = {err:0,msg:"ok",result:jsonArr};
									res.send(JSON.stringify(jsonResult));
								}
							}
						});			
					}
				}
				else {
					var jsonResult = {err:0,msg:"ok",result:jsonArr};
					res.send(JSON.stringify(jsonResult));
				}
			}
		});
	}
}

function integritybycsdnid(req,res){
	var CSDNID = req.body.csdnid;
	var UserName = req.body.username;
	if(!CSDNID){
		res.send('{"err":101, "msg":"缺少csdnid/username参数"}')
	}
	else {
		GetIntegrityByCSDNID(CSDNID,UserName,function(err,datalist){
			if(err){
				res.send(JSON.stringify({err:99,msg:err}));
			}
			else {
				var jsonResult = {err:0,msg:"ok",result:datalist};
				res.send(JSON.stringify(jsonResult));
			}
		});
	}
}

function GetIntegrityByCSDNID(CSDNID,UserName,callback){
	RedisClent.get('userintegrity_' + CSDNID.toString(),function(err, replystr){
		if(err){
			callback(err,null);
		}
		else{
			if(replystr){
				var reply = JSON.parse(replystr);
				callback(null,reply)
			}
			else{
				require('../UCBussiness/userinfo').GetIntegrityByCSDNID(CSDNID,function(dberr){
					callback(dberr,null);
				},function(datalist){
					//存入缓存
					RedisClent.set('userintegrity_' + CSDNID.toString(), JSON.stringify(datalist));
					callback(null,datalist)
				});	
			}
		}
	});
}

function saveupdatedatebycsdnid(req,res){

	var CSDNID = req.body.csdnid;
	var UpdateDate = req.body.updatedate;

	if(!CSDNID){

                res.send('{"err":101, "msg":"缺少csdnid/username参数"}')
        }
	else if(!UpdateDate){
		
		res.send('{"err":101, "msg":"缺少updatedate参数"}')
	}
	else{
	
		require('../UCBussiness/userinfo').SaveUpdateDate(CSDNID,UpdateDate,function(dberr){
			
			res.send('{err:99, msg:"' + dberr + '"}');	
		},function(data){
			RedisClent.set('userinfo_' + CSDNID.toString(), "");
                        res.send('{"err": 0,"msg": "ok"}');		
		});
	}
}

function setSaveUserStatusParams(req){

	var params = {};
	if(paramHelper.checkParams(req.body.verifiedstatus)){
		params.verifiedstatus = req.body.verifiedstatus;
	}
	if(paramHelper.checkParams(req.body.auditedustatus)){
                params.auditedustatus = req.body.auditedustatus;
        }
	if(paramHelper.checkParams(req.body.auditworkstatus)){
                params.auditworkstatus = req.body.auditworkstatus;
        }
	if(paramHelper.checkParams(req.body.auditskillstatus)){
                params.auditskillstatus = req.body.auditskillstatus;
        }
	if(paramHelper.checkParams(req.body.auditinfostatus)){
                params.auditinfostatus = req.body.auditinfostatus;
        }
	if(paramHelper.checkParams(req.body.userstatus)){
                params.userstatus = req.body.userstatus;
        }

	return params;
}

function savestatusbycsdnid(req,res){
	
	var CSDNID = req.body.csdnid;

	if(!CSDNID){

		res.send('{"err":101, "msg":"缺少csdnid/username参数"}')
	}
	else {
		var params = setSaveUserStatusParams(req);
		require('../UCBussiness/userinfo').update_user_status(CSDNID,params,function(dberr){
			res.send('{err:99, msg:"' + dberr + '"}');
		},function(data){
			RedisClent.set('userinfo_' + CSDNID.toString(), "");
			res.send('{"err": 0,"msg": "ok"}');
			
		});
	}

}

function getuser(req, res){
    var username = req.body.username;
    var csdnid = req.body.csdnid;
    var loginemail = req.body.loginemail;
    if(!username&&!csdnid&&!loginemail){
        res.send('{"err":101, "msg":"username,csdnid,loginemail参数不能为空."}');
        return ;
    }
    require('../UCBussiness/userinfo').GetUser(csdnid,username,loginemail
        , function(dberr){
            res.send(JSON.stringify({err:99,msg:dberr}));
        }
        , function(data){
            var jsonResult = {err:0,msg:"ok",result:data};
            res.send(JSON.stringify(jsonResult));
        }
        );

}

function setAddParams(req){
    var params = {};
    if(typeof(req.body.csdnid) != 'undefined'){
        params.CSDNID = req.body.csdnid;
    }
    if(typeof(req.body.username) != 'undefined'){
        params.UserName = req.body.username;
    }
    if(typeof(req.body.loginemail) != 'undefined'){
        params.LoginEmail = req.body.loginemail;
    }
    if(typeof(req.body.nickname) != 'undefined'){
        params.NickName = req.body.nickname;
    }
    if(typeof(req.body.appname) != 'undefined'){
        params.appname = req.body.appname;
    }
    if(typeof(req.body.mobile) != 'undefined'){
	params.Mobile = req.body.mobile;
    }

    return params;
}

//手机注册，创建用户
function adduser(req,res){
    var CSDNID = req.body.csdnid;
    var UserName = req.body.username;
    var Mobile = req.body.mobile;
    if(!CSDNID){
        res.send('{"err":101, "msg":"缺少csdnid参数"}');
    }
    else if(!UserName){
        res.send('{"err":101, "msg":"缺少username参数"}');
    }
    else if(!Mobile){
	res.send('{"err":101, "msg":"缺少mobile参数"}');
    }
    else {
	//检查csdnid,username,mobile唯一性
	require('../UCBussiness/userinfo').CheckUniqueUser(CSDNID,UserName,Mobile,function(dberr){
		res.send(JSON.stringify({err:99,msg:dberr}));
	},function(data){
		if(data>0){
			res.send('{"err":99,"msg":"已经存在此用户"}');
		}
		else{
			require('../UCBussiness/userinfo').InsertUserMobile(setAddParams(req),function(dberr){
				res.send(JSON.stringify({err:99,msg:dberr}));
                        },function(UserID){
                        	if(UserID>0){
                                	res.send('{"err":0,"msg":"ok"}');
                                }
                                else{
                                	res.send('{"err":101,"msg":"录入失败"}');
                                }
			});
		}
	});
    }
}

//添加用户
function addbycsdnid(req,res){
    var CSDNID = req.body.csdnid;
    var UserName = req.body.username;
    var LoginEmail = req.body.loginemail;
    if(!CSDNID){
        res.send('{"err":101, "msg":"缺少csdnid参数"}');
    }
    else if(!UserName){
        res.send('{"err":101, "msg":"缺少username参数"}');
    }
    else{
/**-------------------------此步用意不大,CheckUser会检查用户添加信息唯一性------------------------------
        require('../UCBussiness/userinfo').GetCsdnIDbyUserName(UserName
            , function(dberr){
                res.send('{"err":99,"msg":"' + dberr + '"}');
            }
            , function(data){
                if(JSON.stringify(data) === '{}' || data.csdnid != CSDNID){
**/
	//检查CSDNID，用户名，注册邮箱的唯一性
        require('../UCBussiness/userinfo').CheckUser(CSDNID, UserName, LoginEmail, req.body.nickname
        , function(dberr){
        	res.send(JSON.stringify({err:99,msg:dberr}));
        }
        , function(data){
        	if(data > 0){//已经存在此用户
         		res.send('{"err":101,"msg":"已经存在此用户"}');
                }
                else{
        		require('../UCBussiness/userinfo').InsertUser(setAddParams(req)
                        , function(dberr){
    	                    res.send(JSON.stringify({err:99,msg:dberr}));
                        }
                        , function(UserID){
                     		if(UserID>0){
                    	            res.send('{"err":0,"msg":"ok"}');
                                }
                                else{
                    	            res.send('{"err":101,"msg":"录入失败"}');
                                }
                       });
                }
	});
   }
}
/**
                      });
                }
                else{
                // 根据 csdnid,username 查找，如果找到对应用户，则返回成功
                    res.send('{"err":101,"msg":"CSDNID不能重复录入"}');
                }
**/

function addbycsdnidbyredis(req,res){
    var CSDNID = req.body.csdnid;
    var UserName = req.body.username;
    var LoginEmail = req.body.loginemail;
    if(!CSDNID){
        res.send('{"err":101, "msg":"缺少csdnid参数"}');
    }
    else if(!UserName){
        res.send('{"err":101, "msg":"缺少username参数"}');
    }
    else{
        require('../UCBussiness/userinfo').CheckUser(CSDNID, UserName, LoginEmail, req.body.nickname
            , function(errR,data){
                if(errR){
                    res.send(JSON.stringify({err:105,msg:errR}));
                }
                else{
                    require('../UCBussiness/userinfo').InsertUser(setAddParams(req)
                        , function(dberr){
                            res.send(JSON.stringify({err:99,msg:dberr}));
                        }
                        , function(UserID){
                            if(UserID>0){
                                res.send('{"err":0,"msg":"ok"}');
                            }
                            else{
                                res.send('{"err":101,"msg":"录入失败"}');
                            }
                        });
                }
            }
        );
    }
}

//封杀用户bycsdnid
function killUserByCSDNID(CSDNID,req,res){
    require('../UCBussiness/userinfo').KillByCsdnID(CSDNID
        ,function(dberr){
            res.send(JSON.stringify({err:99,msg:dberr}));
        }
        , function(Count){
            if(Count>0){
                //killed用户后重写缓存
                require('../UCBussiness/userinfo').GetUserInfoByCSDNID(CSDNID
                    , function(dberr){
                    }
                    , function(data){
                        RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(data));
                    });
                res.send('{"err":0,"msg":"ok"}');
            }
            else{
                res.send('{"err":101,"msg":"封杀失败"}');
            }

        }
    );
}
//封杀用户
function killbycsdnid(req,res){
    var CSDNID = req.body.csdnid;
    if(!CSDNID){
        res.send('{"err":101,"msg":"缺少csdnid参数"}');
    }
    else{
        killUserByCSDNID(CSDNID,req,res);
    }
}

function killbyusernames(req ,res){
    var usernames = req.body.usernames;
    if(!usernames){
        res.send('{"err":101,"msg":"缺少usernames参数"}');
    }
    else{
        //KillByUsernames
        require('../UCBussiness/userinfo').KillByUsernames(usernames
            , function(dberr){
                res.send(JSON.stringify({err:99,msg:dberr}));
            }
            , function(data){
                if(data.length>0){
                    for(var i=0 ; i<data.length ; i++){
                        RedisClent.set('userinfo_' + data[i].CSDNID, '');
                    }
                }
                res.send('{"err":0,"msg":"ok"}');
            }
        );
    }
}

function revivebyusernames(req, res){
    var usernames = req.body.usernames;
    if(!usernames){
        res.send('{"err":101,"msg":"缺少usernames参数"}');
    }
    else{
        require('../UCBussiness/userinfo').Revive(usernames
            , function(dberr){
                res.send(JSON.stringify({err:99,msg:dberr}));
            }
            , function(data){
                if(data.length>0){
                    for(var i=0 ; i<data.length ; i++){
                        RedisClent.set('userinfo_' + data[i].CSDNID,'');
                    }
                    res.send('{"err":0,"msg":"ok"}');
                }
                else {
                    res.send('{"err":4,"msg":"解封影响用户为0"}');
                }
        //killUserByCSDNID(CSDNID,req,res);
    	  });
    }
}

//用户基本信息
function getbycsdnid(req,res){
    var CSDNID = req.body.csdnid;
    if(!CSDNID){
        res.send('{"err":101, "msg":"缺少csdnid参数"}');
    }
    else{
        require('../UCBussiness/userinfo').GetUserByCSDNID(CSDNID
            ,function(err,data){
                if(err){
                    res.send(JSON.stringify({err:99,msg:err}));
                }
                else{
                    if(!data){
                        res.send('{"err":0,"msg":"ok","result": {}');
                    }
                    else{
                        var nextupnickspan = 0;
                        if(data.LastUpNickDate){
                            nextupnickspan = 90 - ConTime.dateDiff(data.LastUpNickDate,new Date());
                            if(nextupnickspan<0){
                                nextupnickspan = 0;
                            }
                        }

                        var info = {err:0,msg:"ok"};
                        var result = {};
                        result.csdnid = CSDNID;
                        result.nickname = strHelper.ConvertStr(data.NickName);
                        result.avatarurl = strHelper.ConvertStr(data.AvatarAttachUrl);
                        result.username = strHelper.ConvertStr(data.UserName);
                        result.loginemail = strHelper.ConvertStr(data.LoginEmail);
                        result.nextupnickspan = nextupnickspan;
                        info.result = result;
                        res.send(JSON.stringify(info));
                    }
                }
            }
        );
    }
}

//合并联系信息与联系信息
function combineInfo(CSDNID, datalist, ContactListstr, res){
    var contact = [];
    var loop = 0;
    if(ContactListstr.length>0){
        var contactType = require('../appconfig').contacttype;
        var ContactList = JSON.parse(ContactListstr);
        for(var c=0 ; c<ContactList.length ; c++){
            if(ContactList[c].ContactType === contactType.homepage){
//                if(loop!=0){
//                    contact += ',';
//                }
                contact.push({"contactid": ContactList[c].ContactID,"value":strHelper.ConvertStr(ContactList[c].ContactValue)});
                //contact += '{"contactid":' + ContactList[c].ContactID + ',"value":"' + strHelper.ConvertStr(ContactList[c].ContactValue) + '"}';
                //loop += 1;
            }
        }
    }
    //contact += ']';

    //二维码url
    var qrurl = '';
    if(datalist.QrcodeAttachUrl && datalist.QrcodeAttachUrl!=""){
        qrurl = strHelper.ConvertStr(datalist.QrcodeAttachUrl) ;//require('../appconfig').qr.saveUrl +
    }
    else{
        qrurl = '';
    }
    //昵称修改日期
    var nextupnickspan = 0;
    if(datalist.LastUpNickDate){
        nextupnickspan = 90 - ConTime.dateDiff(datalist.LastUpNickDate,new Date());
        if(nextupnickspan<0){
            nextupnickspan = 0;
        }
    }

    var userDetail = {err:0,msg:"ok"};
    var result = {};
    result.csdnid = CSDNID.toString();
    result.realname = strHelper.ConvertStr(datalist.RealName);
    result.nickname = strHelper.ConvertStr(datalist.NickName);
    result.gender = strHelper.ConvertInt(datalist.Gender);
    if(datalist.Birthday){
    	result.birthday = ConTime.jsDayToStr(datalist.Birthday);
    }
    else {
	result.birthday = datalist.Birthday;
    }
    if(datalist.WorkStartDate){
	result.workstartdate = ConTime.jsDayToStr(datalist.WorkStartDate);
    }
    else {
	result.workstartdate = datalist.WorkStartDate
    }
    result.country = strHelper.ConvertInt(datalist.Country);
    result.province = strHelper.ConvertInt(datalist.Province);
    result.city = strHelper.ConvertInt(datalist.City);
    result.district = strHelper.ConvertInt(datalist.District);
    result.maritalstatus = strHelper.ConvertInt(datalist.MaritalStatus);
    result.ethnic = strHelper.ConvertInt(datalist.Ethnic);
    result.hukou = strHelper.ConvertStr(datalist.Hukou);
    result.avatarurl = strHelper.ConvertStr(datalist.AvatarAttachUrl);
    result.edudegree = strHelper.ConvertInt(datalist.EduDegreeCode);
    result.gradschool = strHelper.ConvertStr(datalist.GraduateSchool);
    result.curcompany = strHelper.ConvertStr(datalist.CurCompany);
    result.curjob = strHelper.ConvertStr(datalist.CurJob);
    result.industrytype = strHelper.ConvertInt(datalist.IndustryType);
    result.homepage = contact;
    result.selfdesc = strHelper.ConvertStr(datalist.SelfDesc);
    result.selfdomain = strHelper.ConvertStr(datalist.SelfDomain);
    result.nextupnickspan = nextupnickspan;
    result.qrcodeattachurl = qrurl;
    result.teamsize = strHelper.ConvertStr(datalist.TeamSize);
    result.card = strHelper.ConvertStr(datalist.Card);
    result.companyintro = strHelper.ConvertStr(datalist.CompanyIntro);
    result.lastupdatedate = ConTime.jsDateTimeToStr(datalist.LastUpdateDate);
    userDetail.result = result;

    res.send(JSON.stringify(userDetail));
}
//联系信息
function getContact(CSDNID, datalist, res){
    RedisClent.get('usercontact_' + CSDNID.toString(), function(err, reply){
        if(err){
            res.send(JSON.stringify({err:99,msg:err}));
        }
        else{
            if(reply){
                combineInfo(CSDNID, datalist, reply, res);
            }
            else{
                require('../UCBussiness/userinfo').GetUserContactByCSDNID(CSDNID
                    ,function(cerr){
                        res.send(JSON.stringify({err:99,msg:cerr}));
                    }
                    ,function(ContactList){
                        if(ContactList.length>0){
                            RedisClent.set('usercontact_' + CSDNID.toString(), JSON.stringify(ContactList));
                        }
                        combineInfo(CSDNID, datalist, JSON.stringify(ContactList), res);
                    }
                );
            }
        }
    });
}

//用户详细信息byCSDNID
function getUserInfoDetailByCSDNID(CSDNID, req, res){
    RedisClent.get('userinfo_' + CSDNID.toString(),function(err, replystr){
        if(err){
            res.send(JSON.stringify({err:99,msg:err}));
        }
        else{
            if(replystr){
                var reply = JSON.parse(replystr);
                if(replystr==='{}'){
                    res.send('{"err":0,"msg":"ok","result": {}');
                }
                else{
                    getContact(CSDNID, reply, res);
                }
            }
            else{
                require('../UCBussiness/userinfo').GetUserInfoByCSDNID(CSDNID.toString()
                    , function(dberr){
                        res.send(JSON.stringify({err:99,msg:dberr}));
                    }
                    , function(data){
                        if(data){
                            RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(data));
                        }
                        if(JSON.stringify(data)==='{}'){
                            res.send('{"err":0,"msg":"ok","result": {}}');
                        }
                        else{
                            getContact(CSDNID, data, res);
                        }
                    });
            }
        }
    });
}

//用户详细信息
function getdetailbycsdnid(req,res){
    var CSDNID = req.body.csdnid;
    if(!CSDNID){
        res.send('{"err":101, "msg":"缺少csdnid参数"}');
    }
    else{
        getUserInfoDetailByCSDNID(CSDNID,req,res);
    }
}

//接收保存详细信息参数
function setSaveDetailUserInfoParams(req,callback){
    var params = {};
    if(paramHelper.checkParams(req.body.teamsize)){
        params.teamsize = req.body.teamsize;
    }
    if(paramHelper.checkParams(req.body.card)){
        params.card = req.body.card;
    }
    if(paramHelper.checkParams(req.body.companyintro)){
        params.companyintro = req.body.companyintro;
    }
    if(paramHelper.checkParams(req.body.gender)){
        params.gender = req.body.gender;
    }
    if(paramHelper.checkParams(req.body.birthday)){
        params.birthday = req.body.birthday;
    }
    if(paramHelper.checkParams(req.body.country)){
        params.country = req.body.country;
    }
    if(paramHelper.checkParams(req.body.province)){
        params.province = req.body.province;
    }
    if(paramHelper.checkParams(req.body.city)){
        params.city = req.body.city;
    }
    if(paramHelper.checkParams(req.body.district)){
        params.district = req.body.district;
    }
    if(paramHelper.checkParams(req.body.maritalstatus)){
        params.maritalstatus = req.body.maritalstatus;
    }
    if(paramHelper.checkParams(req.body.ethnic)){
        params.ethnic = req.body.ethnic;
    }

    if(paramHelper.checkParams(req.body.hukou)){
        params.hukou = req.body.hukou;
    }
    if(paramHelper.checkParams(req.body.workstartdate)){
        params.workstartdate = req.body.workstartdate;
    }
    if(paramHelper.checkParams(req.body.edudegreecode)){
        params.edudegreecode = req.body.edudegreecode;
    }
    if(paramHelper.checkParams(req.body.gradschool)){
        params.graduateschool = req.body.gradschool;
    }
    if(paramHelper.checkParams(req.body.curcompany)){
        params.curcompany = req.body.curcompany;
    }
    if(paramHelper.checkParams(req.body.curjob)){
        params.curjob = req.body.curjob;
    }
    if(paramHelper.checkParams(req.body.industrytype)){
        params.industrytype = req.body.industrytype;
    }

    if(paramHelper.checkParams(req.body.selfdesc)){
        params.selfdesc = req.body.selfdesc;
    }
    if(paramHelper.checkParams(req.body.selfdomain)){
        params.selfdomain = req.body.selfdomain;
    }
    if(paramHelper.checkParams(req.body.qrcodeattachurl)){
        params.qrcodeattachurl = req.body.qrcodeattachurl;
    }

    if(paramHelper.checkParams(req.body.homepage)){
        params.homepage = req.body.homepage;
    }

    if(paramHelper.checkParams(req.body.qq)){
        params.qq = req.body.qq;
    }

    if(paramHelper.checkParams(req.body.clientip)){
        params.clientip = req.body.clientip;
    }

    params.username = req.body.username;
    if(paramHelper.checkParams(req.body.appname)){
        params.appname = req.body.appname;
    }
    if(paramHelper.checkParams(req.body.realname)){
      UserReview.GetByCSDNID(req.body.csdnid,function(err,data){
        if(err || data['realname'] == 0 || data['realname'] == null){
          params.realname = req.body.realname;
        }
        callback(params);
      });
    }else{
      callback(params);
    }
}

//保存用户详细信息
function savebycsdnid(req, res){
    var CSDNID = req.body.csdnid;
    var UserName = req.body.username;
    if(!CSDNID){
        res.send('{"err":101, "msg":"缺少csdnid参数"}');
    }
    else{
      setSaveDetailUserInfoParams(req,function(params){
        var userdetail = require('../UCBussiness/userinfo');

        var async = require('async');

        async.parallel([function(cb){
                userdetail.update_user_info(CSDNID, params, cb);
            }
            , function(cb){
                userdetail.update_user_contact(CSDNID, params, cb);
            }]
            , function (err, results) {
                if(err){
                    res.send('{"err":99, "msg":"' + err + '"}');
                    return;
                }
                else{
                    res.send('{"err":0,"msg":"ok"}');
                    require('../UCBussiness/UpdateUserInfoTime')(CSDNID,UserName);//修改userinfo表更改时间
		    SendNotify(CSDNID,UserName,function(err,data){

		    });
                }

            });
      
      });
    }
}

//根据完整度和发消息状态给用户发消息

function SendNotify(CSDNID,UserName,callback){
	//删除完整度缓存
	RedisClent.delete('userintegrity_' + CSDNID.toString());
	//获取完整度
        GetIntegrityByCSDNID(CSDNID,UserName,function(err,datalist){
        	if(datalist){
                	var integrity=datalist['total'];
                        GetStatusNotify(CSDNID,function(err,value){
                        	if(value){
                               		var status = value['notifystatus']
                               	        if(integrity==100 && status==0){
                                       		//发通知
                                             	require('../UCBussiness/userinfo').Notify(UserName,function(dberr){

                           	                },function(body){
                                   	           	if(body===true){
                                                       		//修改数据库
                                                               	require('../UCBussiness/userinfo').ChangeNotifyStatus(CSDNID,function(dberr,temp){
                                               	               		if(temp){
                                       	                                	//删除通知状态缓存
                                                                               	RedisClent.delete('usernotify_' + CSDNID.toString());
                                                                   	}
                                                                });
							}                                                        
                                                });
                                        }
                                }
                        });
                }
       	});
}

//保存完整度大于90%的用户名
function SaveUserPerfect(CSDNID,UserName,callback){
	async.series([
		function(delete_cb){
			//删除userperfection表数据
			require('../UCBussiness/userinfo').DeletePerfect(CSDNID,function(dberr){
				delete_cb(dberr,null);
			},function(data){
				if(data === true){
					delete_cb(null,1);
				}
				else {
					delete_cb(null,0);
				}
			});
		},
		function(insert_cb){
			//如果完整度达到90%，加入到userperfection表中
			GetIntegrityByCSDNID(CSDNID,UserName,function(err,datalist){
				if(err){
					insert_cb(err,null)
				}
				else {
					if(datalist){
						var integrity=datalist['total'];
						if(integrity >= 90){
							require('../UCBussiness/userinfo').InsertPerfect(CSDNID,UserName,integrity,function(dberr){
								insert_cb(dberr,null)
							},function(data){	
								if(data === true){
									insert_cb(null,1);					
								}
								else{
									insert_cb(null,0);
								}
							});		
						}							
					}
				}
			});
		}
	], function(err, results) {
		if(err){
			callback(err,null);
		}
		else {
			var temp = true;
			for(var i=0;i<results.length;i++){
				if(results[i] != 1){
					temp = false;
					break;
				}
			}
			callback(null,temp);
		}
	});
}

//查看用户完整度通知状态
function GetStatusNotify(CSDNID,callback){
	RedisClent.get('usernotify_' + CSDNID.toString(),function(err, replystr){
		if(replystr){
			var reply = JSON.parse(replystr);
			callback(null,reply)
		}
		else{
			require('../UCBussiness/userinfo').GetStatusNotifyByCSDNID(CSDNID,function(dberr,data){
				if(dberr){
					callback(dberr,null)
				}
				else {
					//存入缓存
                                	RedisClent.set('usernotify_' + CSDNID.toString(), JSON.stringify(data));
					callback(null,data);
				}
			});
		}
	});
}

//保存邮箱
function saveloginemail(req, res){
    var CSDNID = req.body.csdnid;
    var UserName = req.body.username;
    var LoginEmail = req.body.loginemail;
    if(!CSDNID){
        res.send('{"err":101, "msg":"缺少csdnid参数"}');
    }
    else if(!LoginEmail){
        res.send('{"err":101, "msg":"缺少loginemail参数"}');
    }
    else{
        require('../UCBussiness/userinfo').SaveLoginEmail(CSDNID, LoginEmail
            , function(err){
                res.send(JSON.stringify({err:99,msg:err}));
            }
            , function(count){
                if(count>0){
                    require('../UCBussiness/userinfo').GetUserByCSDNID(CSDNID
                        ,function(err,data){
                            if(data){
                                data.LoginEmail = LoginEmail;
                                RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(data));
                            }
                        }
                    );
                    res.send('{"err":0,"msg":"ok"}');
                    require('../UCBussiness/UpdateUserInfoTime')(CSDNID,UserName);//修改userinfo表更改时间
                }
            }
        );
    }
}


function updatestatus(req, res){
    var userhelper = require('../UCBussiness/userinfo');

    var CSDNIDs = req.body.csdnids;
    var operType = req.body.opertype;
    if(!CSDNIDs){
        res.send('{"err":101, "msg":"缺少csdnid参数"}');
    }
    else if(!operType){
        res.send('{"err":101, "msg":"缺少opertype参数"}');
    }
    else{
        userhelper.save_status_by_csdnids({csdnids: CSDNIDs, opertype: operType }
            , function(err, result){
                if(err){
                    res.send(JSON.stringify({err:99,msg:err}));
                    return;
                }

                res.send('{"err":0,"msg":"ok"}');
            });
    }
}

function getbynickname(req, res){
    var nickname = req.body.nickname;
    if(!nickname){
        res.send('{"err":101, "msg":"缺少nickname参数"}');
    }
    else{
        var userhelper = require('../UCBussiness/userinfo');
        userhelper.GetUsernameByNick(nickname
            , function(err,data){
                if(err){
                    res.send(JSON.stringify({err:99,msg:err}));
                }
                else{
                    var jsonResult = {err:0,msg:"ok",result:JSON.parse(data)};
                    res.send(JSON.stringify(jsonResult));
                }
            }
        );
    }
}

function getusernamesbyperfection(req,res){
   var pagesize = req.body.pagesize;
   var pageno = req.body.pageno;
   if(!pagesize)
	pagesize = 20;
   if(!pageno)
	pageno = 1;
   require('../UCBussiness/userinfo').UserNameListByPerfection(pagesize,pageno,function(dberr){
	res.send(JSON.stringify({err:99,msg:dberr}));
   },function(datalist){
	var jsonResult = {err:0,msg:"ok",result:datalist};
	res.send(JSON.stringify(jsonResult));
   });
}

exports.sendnotify = SendNotify;
exports.saveuserperfection = SaveUserPerfect;
