/**
 * Created by zlj on 13-11-22.
 */
var RedisClent = require('../Utility/Redis')();
var paramHelper = require('../Utility/checkparam')();
var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
var strHelper = require('../Utility/StringHelper')();
var ConTime = require('../Utility/time')();

module.exports.autoroute = {
    post: {
         '/userworkexp/getbycsdnid' : getbycsdnid    
        , '/userworkexp/getbyusername' : getbycsdnid    
        , '/userworkexp/savebyworkid' : savebyworkid    
        , '/userworkexp/savebyworkiduname' : savebyworkid
        , '/userworkexp/delbycsdnid': delbycsdnid
        , '/userworkexp/delbyusername': delbycsdnid
				, '/userworkexp/getcountbyorgnames': getcountbyorgnames //获取同事数量
    }
};

function getcountbyorgnames(req,res){

        var orgnames = req.body.orgnames;
        if(!orgnames){
                res.send('{"err":101, "msg":"缺少orgnames参数"}');
        }
        var jsonArr = new Array();
        if(orgnames.length > 0){

                var orgs = JSON.stringify(orgnames).replace('[','').replace(']','');
                var sqlfornumber = "SELECT  OrgName,count(distinct username) FROM userwork where OrgName in(" + orgs + ')' + "group by OrgName";
                sqlhelper.ExecuteDataTable("uc", sqlfornumber, {}, function(dberr, data) {

                        if (dberr) {
                                res.send(JSON.stringify({err:99,msg:dberr}));
                        }
                        else{
                                for(var i=0;i<data.length;i++){
                                        var orgname = data[i]['OrgName'];
                                        var count = data[i]['count(distinct username)'] -1;
                                        var content={'orgname':orgname,'workmatecount':count};
                                        jsonArr.push(content);
                                }
                                var jsonResult = {err:0,msg:"ok",result:jsonArr};
                                res.send(JSON.stringify(jsonResult));
                        }

                });
        }

}

function getbycsdnid(req, res){
	var csdnid = req.body.csdnid;
  var key='userworkexp_'+csdnid;
  if(!csdnid){
  	res.send('{"err":98, "msg":"缺少csdnid参数"}');
  }
    else{
        //先从redis中找数据
        RedisClent.get(key,function(err, reply){
        	if(err){//redis异常
          	 // res.send('{"err":99, "msg":"' + err + '"}');
        	}
        	if(reply){//从redis中取得数据 并返回
        		res.send('{"err":0,"msg":"ok","result":'+reply+'}');
        	}
        	else{//从数据库中取得，并且存入redis
        		require('../UCBussiness/userworkexpprovider').GetByCSDNIDModule(csdnid, function(dberr){
          		res.send('{succ:99, msg:"' + dberr + '"}');
        	}, function(workInfo){
        		//RedisClent.set(key, workInfo);
						//返回值处理
						var jsonWork = [];
						for(var i=0 ; i<workInfo.length ; i++){
			  			var WorkBeginDate="";
			  			if(workInfo[i].WorkBeginDate == "0000-00-00 00:00:00" || workInfo[i].WorkBeginDate == "" || !workInfo[i].WorkBeginDate){
			    			WorkBeginDate = "";
			 	 			}
			  			else {
			   	 			WorkBeginDate = ConTime.jsDayToStr(workInfo[i].WorkBeginDate);
			  			}
			  			var WorkEndDate="";
            	if(workInfo[i].WorkEndDate == "0000-00-00 00:00:00" || workInfo[i].WorkEndDate == "" || !workInfo[i].WorkEndDate){
           			WorkEndDate = "";
            	}
            	else {
            		WorkEndDate = ConTime.jsDayToStr(workInfo[i].WorkEndDate);
          		}
            	jsonWork.push({
			    			workid:workInfo[i].WorkID,
			    			workbegindate:WorkBeginDate,
			    			workenddate:WorkEndDate,
			    			orgid:workInfo[i].OrgID,
			    			orgname:strHelper.ConvertStr(workInfo[i].OrgName),
			    			job:strHelper.ConvertStr(workInfo[i].Job),
			    			departname:strHelper.ConvertStr(workInfo[i].DepartName),
			    			workdesc:strHelper.ConvertStr(workInfo[i].WorkDesc)
			  			});
						}
						//存入缓存
						RedisClent.set(key, JSON.stringify(jsonWork));
						var jsonResult = {err:0,msg:"ok",result:jsonWork};
          	res.send(JSON.stringify(jsonResult));
      		});               
    		}
    	});
   	}
}

function savebyworkid(req, res){
  var csdnid = req.body.csdnid;
  var workid = req.body.workid;
  //var userwork=req.body.userwork;
  var username = req.body.username;
  var key='userworkexp_'+csdnid;
  if(!username){
    res.send('{"err":98, "msg":"缺少username参数"}');
  }
  else if (workid==null||workid.toString()=="") {
    res.send('{"err":98, "msg":"缺少workid参数"}');
  }
  else {
    require('../UCBussiness/userworkexpprovider').SaveByWorkIdModule(req,username,csdnid,function(dberr){
      res.send('{"err":99, "msg":"' + dberr + '"}');
    }, function(workid){
      //RedisClent.set(key, "");
      require('../UCBussiness/UpdateUserInfoTime')(csdnid,username);//修改userinfo表更改时间
      res.send('{"err": 0, "msg": "ok", "result": {"workid":' + workid + '}}');
      //判断发送消息
      require('./userinfo').sendnotify(csdnid,username,function(err,data){

      });
      //从数据库中取得，并且存入redis
      require('../UCBussiness/userworkexpprovider').GetByCSDNIDModule(csdnid, function(dberr){
        res.send('{succ:99, msg:"' + dberr + '"}');
      }, function(workInfo){
        //RedisClent.set(key, workInfo);
        //返回值处理
          var jsonWork = [];
          for(var i=0 ; i<workInfo.length ; i++){
            var WorkBeginDate="";
            if(workInfo[i].WorkBeginDate == "0000-00-00 00:00:00" || workInfo[i].WorkBeginDate == "" || !workInfo[i].WorkBeginDate){
              WorkBeginDate = "";
            }
            else {
              WorkBeginDate = ConTime.jsDayToStr(workInfo[i].WorkBeginDate);
            }
            var WorkEndDate="";
            if(workInfo[i].WorkEndDate == "0000-00-00 00:00:00" || workInfo[i].WorkEndDate == "" || !workInfo[i].WorkEndDate){
              WorkEndDate = "";
            }
            else {
              WorkEndDate = ConTime.jsDayToStr(workInfo[i].WorkEndDate);
            }
            jsonWork.push({
              workid:workInfo[i].WorkID,
              workbegindate:WorkBeginDate,
              workenddate:WorkEndDate,
              orgid:workInfo[i].OrgID,
              orgname:strHelper.ConvertStr(workInfo[i].OrgName),
              job:strHelper.ConvertStr(workInfo[i].Job),
              departname:strHelper.ConvertStr(workInfo[i].DepartName),
              workdesc:strHelper.ConvertStr(workInfo[i].WorkDesc)
            });
          }
          //存入缓存
          RedisClent.set(key, JSON.stringify(jsonWork));
      });
    });    
  }
}


function delbycsdnid(req, res){
    var CSDNID = req.body.csdnid;
    var WorkID = req.body.workid;
    var UserName = req.body.username;
    var key='userworkexp_'+CSDNID;
    if(!CSDNID){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else if(!paramHelper.checkParams(WorkID)){
        res.send('{"err":99, "msg":"缺少workid参数"}');
    }
    else{
        require('../UCBussiness/userworkexpprovider').DeleteWorkExp(CSDNID,WorkID
            ,function(err,count){
                if(err){
                    res.send('{"err":99, "msg":"'+err+'"}');
                }
                else{
                    if(count>0){
                        //RedisClent.set('userworkexp_'+CSDNID,  "");
                        res.send('{"err":0,"msg":"ok"}');
			require('../UCBussiness/UpdateUserInfoTime')(CSDNID,UserName);//修改userinfo表更改时间
			var Note = 'work'
			require('../UCBussiness/MarkDeleteInfo')(UserName,WorkID,Note);//记录用户删除工作经历详情
			//判断发送消息
                        require('./userinfo').sendnotify(CSDNID,UserName,function(err,data){

                        });
			//从数据库中取得，并且存入redis
			require('../UCBussiness/userworkexpprovider').GetByCSDNIDModule(CSDNID, function(dberr){
                          res.send('{succ:99, msg:"' + dberr + '"}');
                        }, function(workInfo){
                          //RedisClent.set(key, workInfo);
                          //返回值处理
                          var jsonWork = [];
                          for(var i=0 ; i<workInfo.length ; i++){
                            var WorkBeginDate="";
                            if(workInfo[i].WorkBeginDate == "0000-00-00 00:00:00" || workInfo[i].WorkBeginDate == "" || !workInfo[i].WorkBeginDate){
                              WorkBeginDate = "";
                            }
                            else {
                              WorkBeginDate = ConTime.jsDayToStr(workInfo[i].WorkBeginDate);
                            }
                            var WorkEndDate="";
                            if(workInfo[i].WorkEndDate == "0000-00-00 00:00:00" || workInfo[i].WorkEndDate == "" || !workInfo[i].WorkEndDate){
                              WorkEndDate = "";
                            }
                            else {
                              WorkEndDate = ConTime.jsDayToStr(workInfo[i].WorkEndDate);
                            }
                            jsonWork.push({
                              workid:workInfo[i].WorkID,
                              workbegindate:WorkBeginDate,
                              workenddate:WorkEndDate,
                              orgid:workInfo[i].OrgID,
                              orgname:strHelper.ConvertStr(workInfo[i].OrgName),
                              job:strHelper.ConvertStr(workInfo[i].Job),
                              departname:strHelper.ConvertStr(workInfo[i].DepartName),
                              workdesc:strHelper.ConvertStr(workInfo[i].WorkDesc)
                            });
                          }
                          //存入缓存
                          RedisClent.set(key, JSON.stringify(jsonWork));
                        });			
                    }
                    else{
                        res.send('{"err":99, "msg":"保存不成功"}');
                    }
                }
            }
        );
    }
}
