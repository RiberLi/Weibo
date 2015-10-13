var RedisClent = require('../Utility/Redis')();
var paramHelper = require('../Utility/checkparam')();
var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
var ConTime = require('../Utility/time')();
var strHelper = require('../Utility/StringHelper')();

module.exports.autoroute = {
    post: {
         '/userproject/getbycsdnid' : getbycsdnid
        , '/userproject/getbyusername' : getbycsdnid
        , '/userproject/savebyproid' : savebyprojectid
        , '/userproject/savebyproiduname' : savebyprojectid
        , '/userproject/delbycsdnid': delbycsdnid
        , '/userproject/delbyusername': delbycsdnid
    }
};

function GetProject(CSDNID,callback){
	RedisClent.get('userproject_' + CSDNID.toString(), function(err, replystr){
		if(err){
			callback(err,null);
			res.send('{"err":99, "msg":"' + err + '"}');
		}
		else{
			if(replystr){
				var reply = JSON.parse(replystr);
				callback(null,reply);
			}
			else{
				require('../UCBussiness/userproject').GetByCSDNID(CSDNID,function(dberr){
					callback(dberr,null);
				},function(ProInfo){
					if(ProInfo.length>0){
						RedisClent.set('userproject_' + CSDNID.toString(), JSON.stringify(ProInfo));
					}
					callback(null,ProInfo);
				});
			}
		}
	});
}

function getbycsdnid(req,res){
	var CSDNID = req.body.csdnid;
	var UserName = req.body.username;
	var ProjectType = req.body.projecttype;
	if(!CSDNID){
		res.send('{"err":99, "msg":"缺少csdnid参数"}');
	}
	else {
		GetProject(CSDNID,function(err,ProList){
			var jsonPro = [];
			for(var i=0;i<ProList.length;i++){
				var StartDate = "";
				var EndDate = "";
				if(ProList[i].EndDate == "0000-00-00 00:00:00" || ProList[i].EndDate == "" || !ProList[i].EndDate){
					EndDate = "";
				}
				else {
					EndDate = ConTime.jsDayToStr(ProList[i].EndDate);
				}
				if(ProList[i].StartDate == "0000-00-00 00:00:00" || ProList[i].StartDate == "" || !ProList[i].StartDate){
                                        StartDate = "";
                                }
                                else {
                                        StartDate = ConTime.jsDayToStr(ProList[i].StartDate);
                                }
				if(!ProjectType || ProjectType === ProList[i].ProjectType){				
					jsonPro.push({
						projectid:ProList[i].ProjectID,
						projectname:ProList[i].ProjectName,
						projecttype:ProList[i].ProjectType,
						projectref:ProList[i].ProjectRef,
						startdate:StartDate,
						enddate:EndDate,
						projectdesc:strHelper.ConvertStr(ProList[i].ProjectDesc),
						fromsystem:ProList[i].FromSystem
					});
				}
			}
			var jsonResult = {err:0,msg:"ok",result:jsonPro};
			res.send(JSON.stringify(jsonResult));
		});
	}
}

function setProInfoParams(req){
	var params = {};
	if(paramHelper.checkParams(req.body.projecttype)){
		params.projecttype = paramHelper.getParams(req, 'projecttype');
	}
	if(paramHelper.checkParams(req.body.projectname)){
                params.projectname = paramHelper.getParams(req, 'projectname');
        }
	if(paramHelper.checkParams(req.body.startdate)){
                params.startdate = paramHelper.getParams(req, 'startdate');
        }
	if(paramHelper.checkParams(req.body.enddate)){
                params.enddate = paramHelper.getParams(req, 'enddate');
        }
        if(paramHelper.checkParams(req.body.projectdesc)){
                params.projectdesc = paramHelper.getParams(req, 'projectdesc');
        }
	if(paramHelper.checkParams(req.body.projectjob)){
                params.projectjob = paramHelper.getParams(req, 'projectjob');
        }
        if(paramHelper.checkParams(req.body.projectref)){
                params.projectref = paramHelper.getParams(req, 'projectref');
        }
	if(paramHelper.checkParams(req.body.fromsystem)){
		params.fromsystem = paramHelper.getParams(req, 'fromsystem');
	}
      	return params;  
}

function SaveProject(CSDNID,UserName,ProjectID,params,res){
	require('../UCBussiness/userproject').SaveByCSDNID(CSDNID,UserName,ProjectID,params,function(err){
		res.send('{"err":99,"msg":"' + err + '"}');
	},function(projectid){
		require('../UCBussiness/userproject').GetByCSDNID(CSDNID,function(dberr){
			res.send('{"err":99, "msg":"' + dberr + '"}');		
		},function(proInfo){
			RedisClent.set('userproject_' + CSDNID.toString(), JSON.stringify(proInfo));
		});
		res.send('{"err":0,"msg":"ok", "result":{"projectid": ' + projectid + '}}');		
		require('../UCBussiness/UpdateUserInfoTime')(CSDNID,UserName);//修改userinfo表更改时间
	});	
}

function savebyprojectid(req,res){
	var CSDNID = req.body.csdnid;
	var UserName = req.body.username;
	var ProjectID = req.body.projectid;
	var ProjectType = req.body.projecttype;
	if(!CSDNID){
		res.send('{"err":99, "msg":"缺少csdnid参数"}');
	}
	else if(!ProjectID && ProjectID != 0){
		res.send('{"err":99, "msg":"缺少项目projectid参数"}');
	}
	else if(!ProjectType){
		res.send('{"err":99, "msg":"缺少项目projecttype参数"}');
	}
	else {
		SaveProject(CSDNID,UserName,ProjectID,setProInfoParams(req),res)
	}
}

function delbycsdnid(req,res){
	var CSDNID = req.body.csdnid;
	var UserName = req.body.username;
	var projectid = req.body.projectid;
	if(!CSDNID){
                res.send('{"err":99, "msg":"缺少csdnid参数"}');
        }
	else if(!projectid){
		res.send('{"err":99, "msg":"缺少projectid参数"}');
	}
	else {
		require('../UCBussiness/userproject').DeleteProjectByID(CSDNID,projectid,function(dberr){
			res.send('{"err":99, "msg":"'+dberr+'"}');
		},function(count){
			if(count>0){
				RedisClent.set('userproject_'+CSDNID.toString(),"");
				res.send('{"err":0,"msg":"ok"}');
				require('../UCBussiness/UpdateUserInfoTime')(CSDNID,UserName);//修改userinfo表更改时间
				
			}
		});
	}
	
}
