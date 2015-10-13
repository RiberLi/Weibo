/**
 * Created by Liujunjie on 13-12-4.
 */
var RedisClent = require('../Utility/Redis')();
var strHelper = require('../Utility/StringHelper')();
var ConTime = require('../Utility/time')();
var paramHelper = require('../Utility/checkparam')();
var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);

module.exports.autoroute = {
    post: {
        '/usereduexp/getbycsdnid' : getbycsdnid   //获取教育经历
        ,'/usereduexp/getbyusername': getbycsdnid
        ,'/usereduexp/savebyeduid': savebyeduid     //保存教育经历
        ,'/usereduexp/savebyeduiduname': savebyeduid
        , '/usereduexp/delbycsdnid': deletebycsdnid
        , '/usereduexp/delbyusername': deletebycsdnid
				, '/usereduexp/deletebyusername': deletebyusername //后台删除教育经历
				, '/usereduexp/saveeduflagbycsdnid':saveflagbyusername  //修改认证字段
				, '/usereduexp/getcountbyschoolnames':getcountbyschoolnames //获取校友数量
    }
};

function getcountbyschoolnames(req,res){

	var schoolnames = req.body.schoolnames;
	if(!schoolnames){
		res.send('{"err":101, "msg":"缺少schoolnames参数"}');
	}
	var jsonArr = new Array();
	if(schoolnames.length > 0){
	
		var schools = JSON.stringify(schoolnames).replace('[','').replace(']','');
		var sqlfornumber = "SELECT  Schoolname,count(distinct username) FROM useredu where SchoolName in(" + schools + ')' + "group by Schoolname";
		sqlhelper.ExecuteDataTable("uc", sqlfornumber, {}, function(dberr, data) {
				
			if (dberr) {
                 		res.send(JSON.stringify({err:99,msg:dberr}));
                    	}
			else{
				for(var i=0;i<data.length;i++){
					var schoolname = data[i]['Schoolname'];
					var count = data[i]['count(distinct username)'] -1;
					var content={'schoolname':schoolname,'studentcount':count};
					jsonArr.push(content);
				}
				var jsonResult = {err:0,msg:"ok",result:jsonArr};
				res.send(JSON.stringify(jsonResult));
			}

		});
	}

}

function deletebyusername(req,res){
	
	var CSDNID = req.body.csdnid;
	var UserName = req.body.username;
	if(!paramHelper.checkParams(CSDNID)){
		res.send('{"err":99, "msg":"缺少csdnid/username参数"}');
	}
	else if(!paramHelper.checkParams(req.body.eduid)){
		res.send('{"err":99, "msg":"缺少eduid参数"}');
	}
	else{
		var params = setEduInfoParams(req);
		GetEdu(CSDNID
			 ,function(err,data){
				 if(err){
					 res.send('{"err":99, "msg":"'+err+'"}');
				 }
				 else{
					var flag = false;
					 for(var i=0 ; i<data.length ; i++){
						 if(data[i].EduID==params.eduid &&  data[i].Status==require('../appconfig').businessStauts.normal){
							  flag = true;
							  data[i].Status = require('../appconfig').businessStauts.delete;
							  break;
						 }
					}
					 if(flag==false){
						res.send('{"err":99, "msg":"该用户没有此教育经历数据"}');
					}		
					 else{
						 require('../UCBussiness/usereduexp').DeleteEduExp(CSDNID,params.eduid
							,function(showerr,count){
								 if(showerr){
									res.send('{"err":99, "msg":"'+showerr+'"}');
								 }
								else {
									RedisClent.set('useredu_' + CSDNID.toString(), JSON.stringify(data));
									require('../UCBussiness/UpdateUserInfoTime')(CSDNID,UserName);//修改userinfo表更改时间
									res.send('{"err":0,"msg":"ok"}');
									var Note='edu';
                                    					require('../UCBussiness/MarkDeleteInfo')(UserName,params.eduid,Note);//记录用户删除教育经历详情
									//判断发送消息
                                    					require('./userinfo').sendnotify(CSDNID,UserName,function(err,data){

                                    					});
								}	
							}	
						);
					}
				 }
			 }
		);
		 
	}
	
}

function saveflagbyusername(req,res){

    var params = {};
    if(paramHelper.checkParams(req.body.eduflag)){
    	params.eduflag = paramHelper.getParams(req, 'eduflag');	
    }
    params.username = req.body.username;
    params.eduid = req.body.eduid;
    var CSDNID = req.body.csdnid;
    var EduID = req.body.eduid;
    
    if(!CSDNID){
	 res.send('{"err":99, "msg":"缺少csdnid/username参数"}');	
    }
    else if(!EduID){
    	 res.send('{"err":99, "msg":"缺少eduid参数"}');
    }
    else{
	require('../UCBussiness/usereduexp').SaveEduFlag(CSDNID, params
		 , function(err){
			 res.send('{"err":99,"msg":"' + err + '"}');
		},function(ID){
			 //RedisClent.set('useredu_' + CSDNID.toString(),"");
			 res.send('{"err": 0,"msg": "ok","result":{"eduid": ' + ID + '}}');
			 //获取用户新的教育经历存入缓存
			 require('../UCBussiness/usereduexp').GetEdu(CSDNID
                	 	, function(dberr){
                         }
                         , function(eduInfo){
                         	RedisClent.set('useredu_' + CSDNID.toString(), JSON.stringify(eduInfo));
                         });
		});
	
    }

}



//获取教育经历
function getbycsdnid(req,res){
    var CSDNID = req.body.csdnid;
    if(!CSDNID){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else{
        GetEdu(CSDNID
            ,function(err,eduInfo){
                var jsonEdu = [];
                for(var i=0 ; i<eduInfo.length ; i++){
                    if(eduInfo[i].Status == require('../appconfig').businessStauts.normal){
			var EduEndDate = "";
			if(eduInfo[i].EduEndDate == "0000-00-00 00:00:00" || eduInfo[i].EduEndDate == "" || !eduInfo[i].EduEndDate){
				EduEndDate = "";
			}
			else {
				EduEndDate = ConTime.jsDayToStr(eduInfo[i].EduEndDate);
			}
                        jsonEdu.push({eduid:eduInfo[i].EduID
                                ,edustartdate:ConTime.jsDayToStr(eduInfo[i].EduStartDate)
                                ,eduenddate:EduEndDate
				//,schoolorgid:eduInfo[i].SchoolOrgID
                                ,schoolname:strHelper.ConvertStr(eduInfo[i].SchoolName)
                                ,major:eduInfo[i].Major
				,majorstr:eduInfo[i].MajorStr
                                ,degree:eduInfo[i].Degree
				,univsystem:eduInfo[i].UnivSystem
				,eduflag:eduInfo[i].EduFlag
                            }
                        );
                    }
                }
                var jsonResult = {err:0,msg:"ok",result:jsonEdu};
                res.send(JSON.stringify(jsonResult));
            }
        );
    }
}

//通过csdnid取得教育经历
function GetEdu(CSDNID,callback){
    RedisClent.get('useredu_' + CSDNID.toString(), function(err, replystr){
            if(err){
                res.send('{"err":99, "msg":"' + err + '"}');
                callback(err,null);
            }
            else{
                if(replystr){
                    var reply = JSON.parse(replystr);
                    callback(null,reply);
                }
                else{
                    require('../UCBussiness/usereduexp').GetEdu(CSDNID
                        , function(dberr){
                            callback(dberr,null);
                        }
                        , function(eduInfo){
                            if(eduInfo.length>0){
                                RedisClent.set('useredu_' + CSDNID.toString(), JSON.stringify(eduInfo));
                            }
                            callback(null,eduInfo);
                        }
                    );
                }
            }
        }
    );
}

exports.getedu = GetEdu;

//接收保存教育经历详细信息参数
function setEduInfoParams(req){
    var params = {};
    if(paramHelper.checkParams(req.body.eduid)){
        params.eduid = paramHelper.getParams(req, 'eduid');
    }
    if(paramHelper.checkParams(req.body.edustartdate)){
        params.edustartdate = paramHelper.getParams(req, 'edustartdate');
    }
    if(paramHelper.checkParams(req.body.eduenddate)){
        params.eduenddate = paramHelper.getParams(req, 'eduenddate');
    }
   /** if(paramHelper.checkParams(req.body.schoolorgid)){
        params.schoolorgid = paramHelper.getParams(req, 'schoolorgid');
    }**/
    if(paramHelper.checkParams(req.body.schoolname)){
        params.schoolname = paramHelper.getParams(req, 'schoolname');
    }
    if(paramHelper.checkParams(req.body.major)){
        params.major = paramHelper.getParams(req, 'major');
    }
    if(paramHelper.checkParams(req.body.majorstr)){
        params.majorstr = paramHelper.getParams(req, 'majorstr');
    }
    if(paramHelper.checkParams(req.body.degree)){
        params.degree = paramHelper.getParams(req, 'degree');
    }
    if(paramHelper.checkParams(req.body.univsystem)){
        params.univsystem = paramHelper.getParams(req, 'univsystem');
    }
    params.username = req.body.username;
    return params;
}

//保存教育经历by csdnid
function saveEdu(CSDNID, UserName,params, res){
    require('../UCBussiness/usereduexp').SaveEdu(CSDNID, params
        , function(err){
            res.send('{"err":99,"msg":"' + err + '"}');
        }
        , function(ID){
            require('../UCBussiness/usereduexp').GetEdu(CSDNID
                , function(dberr){
                }
                , function(eduInfo){
                    RedisClent.set('useredu_' + CSDNID.toString(), JSON.stringify(eduInfo));
                }
            );
            res.send('{"err":0,"msg":"ok", "result":{"eduid": ' + ID + '}}');
            require('../UCBussiness/UpdateUserInfoTime')(CSDNID,UserName);//修改userinfo表更改时间
            //判断发送消息
            require('./userinfo').sendnotify(CSDNID,UserName,function(err,data){

            });
	}
    );
}

//保存教育经历
function savebyeduid(req,res){
    var CSDNID = req.body.csdnid;
    var UserName = req.body.username;
    if(!CSDNID){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else{
        saveEdu(CSDNID,UserName, setEduInfoParams(req), res);
    }
}

//删除
function deletebycsdnid(req, res){
    var CSDNID = req.body.csdnid;
    var UserName = req.body.username;
    if(!paramHelper.checkParams(CSDNID)){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else if(!paramHelper.checkParams(req.body.eduid)){
        res.send('{"err":99, "msg":"缺少eduid参数"}');
    }
    else{
        var params = setEduInfoParams(req);
        GetEdu(CSDNID
            ,function(err,data){
                if(err){
                    res.send('{"err":99, "msg":"'+err+'"}');
                }
                else{
                    var flag = false;
                    for(var i=0 ; i<data.length ; i++){
                        if(data[i].EduID==params.eduid &&
                            data[i].Status==require('../appconfig').businessStauts.normal){
                            flag = true;
			    var eduflag = data[i].EduFlag;
                            data[i].Status = require('../appconfig').businessStauts.delete;
                            break;
                        }
                    }
                    if(flag==false){
                        res.send('{"err":99, "msg":"该用户没有此教育经历数据"}');
                    }
                    else{
			if(eduflag==1){
			  res.send('{"err":99, "msg":"该教育经历已认证,不允许删除"}');
			}
			else{
                          //逻辑删除
                          require('../UCBussiness/usereduexp').DeleteByCSDNID(CSDNID,params.eduid,eduflag
                              ,function(showerr,count){
                                  if(showerr){
                                      res.send('{"err":99, "msg":"'+showerr+'"}');
                                  }
                                  else{
                                      RedisClent.set('useredu_' + CSDNID.toString(), JSON.stringify(data));
				      require('../UCBussiness/UpdateUserInfoTime')(CSDNID,UserName);//修改userinfo表更改时间
                                      res.send('{"err":0,"msg":"ok"}');
				      var Note='edu';
				      require('../UCBussiness/MarkDeleteInfo')(UserName,params.eduid,Note);//记录用户删除教育经历详情
				      //判断发送消息
                		      require('./userinfo').sendnotify(CSDNID,UserName,function(err,data){

                		      });
                                  }
                              }
                          );
			}
                    }
                }
            }
        );
    }
}
