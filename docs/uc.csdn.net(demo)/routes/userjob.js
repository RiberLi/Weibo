var RedisClent = require('../Utility/Redis')();
var strHelper = require('../Utility/StringHelper')();
var paramHelper = require('../Utility/checkparam')();

module.exports.autoroute = {
    post:{
	 '/userjobinfo/getbyusername': getbycsdnid //通过用户名获取用户工作求职信息
	,'/userjobinfo/getbycsdnid': getbycsdnid //通过csdnid获取用户工作求职信息
	,'/userjobinfo/savebyusername': savebycsdnid //通过用户名保存修改用户的工作求职信息
	,'/userjobinfo/savebycsdnid': savebycsdnid //通过csdnid保存修改用户的工作求职信息
    }
};

function SetParamsInfo(req){
	var params = {};
	if(paramHelper.checkParams(req.body.jobstatus)){
		params.jobstatus=req.body.jobstatus;
	}
	if(paramHelper.checkParams(req.body.jobpost)){
                params.jobpost=req.body.jobpost;
        }
	if(paramHelper.checkParams(req.body.jobtype)){
                params.jobtype=req.body.jobtype;
        }
	if(paramHelper.checkParams(req.body.jobsalary)){
                params.jobsalary=req.body.jobsalary;
        }
	if(paramHelper.checkParams(req.body.jobprovince)){
                params.jobprovince=req.body.jobprovince;
        }
	if(paramHelper.checkParams(req.body.jobcity)){
                params.jobcity=req.body.jobcity;
        }
	if(paramHelper.checkParams(req.body.jobindustry)){
                params.jobindustry=req.body.jobindustry;
        }
	if(paramHelper.checkParams(req.body.jobcomment)){
                params.jobcomment=req.body.jobcomment;
        }
	return params;
}

function savebycsdnid(req,res){
	var CSDNID=req.body.csdnid;
	var username=req.body.username;
	if(!CSDNID){
		res.send('{"err":99, "msg":"缺少csdnid参数"}');
	}
	else {
		var params = SetParamsInfo(req);
		require('../UCBussiness/userjob').SavebyIDModule(CSDNID,username,params,
			function(err){
				res.send('{"err":99, "msg":"' + err + '"}');
			},function(result){
				if(result===-1){
                                	res.send('{err:0,msg:"无可保存修改信息"}');
				}
				else {
					res.send('{err:0,msg:"ok"}');
					//更新缓存
					require('../UCBussiness/userjob').GetbyIDModule(CSDNID,function(dberr){
	
					},function(datalist){
						RedisClent.set('userjobinfo_' + CSDNID.toString(), JSON.stringify(datalist));
					});
					require('../UCBussiness/UpdateUserInfoTime')(CSDNID,username);//修改userinfo表更改时间
				}
		});
	}
}

function getUserJobInfo(CSDNID,callback){
        RedisClent.get('userjobinfo_' + CSDNID.toString(),function(err, replystr){
                if(err){
                        callback(err,null);
                }
                else{
                        if(replystr){
                                var reply = JSON.parse(replystr);
                                callback(null,reply);
                        }
                        else {
                                require('../UCBussiness/userjob').GetbyIDModule(CSDNID,
                                        function(dberr){
                                                callback(dberr,null)
                                        },function(datalist){
                                                if(datalist.length>0){
                                                        RedisClent.set('userjobinfo_' + CSDNID.toString(), JSON.stringify(datalist));
                                                }
                                                callback(null,datalist);
                                        });
                        }
                }
        });
}

function getbycsdnid(req,res){
        var CSDNID = req.body.csdnid;
        //var UserName= req.body.username;
        if(!CSDNID){
                res.send('{"err":99, "msg":"缺少csdnid参数"}');
        }
        else {
                getUserJobInfo(CSDNID,function(err,datalist){
                        if(err){
                                res.send('{"err":99, "msg":"' + err + '"}');
                        }
                        else {
				var jsonUserJob = [];
				if(datalist.length>0){
                                	jsonUserJob.push({
                                        	csdnid:CSDNID,
                                        	username:strHelper.ConvertStr(datalist[0].UserName),
                                        	jobstatus:datalist[0].JobStatus,
                                        	jobpost:strHelper.ConvertStr(datalist[0].JobPost),
                                        	jobtype:datalist[0].JobType,
                                        	jobsalary:strHelper.ConvertStr(datalist[0].JobSalary),
                                        	jobprovince:strHelper.ConvertStr(datalist[0].JobProvince),
                                        	jobcity:strHelper.ConvertStr(datalist[0].JobCity),
                                        	jobindustry:strHelper.ConvertStr(datalist[0].JobIndustry),
                                        	jobcomment:strHelper.ConvertStr(datalist[0].JobComment)
                                	});
				}
                                var jsonResult = {err:0,msg:"ok",result:jsonUserJob};
                                res.send(JSON.stringify(jsonResult));
                        }
                });
        }
}
