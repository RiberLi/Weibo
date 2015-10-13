/**
 * Created by zlj on 13-11-22.
 */
var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);

var ConTime = require('../Utility/time')();
/*
通过csdnid获取
*/
function GetByCSDNID(csdnid,callbackerr, callback){    
  var str = '';
  var sql = "SELECT * FROM userwork ";
  sql += " WHERE CSDNID=@CSDNID and Status=" + require('../appconfig').businessStauts.normal + " order by WorkBeginDate desc;";
  var params = {'CSDNID': csdnid};
  sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
    if(dberr){//数据库异常
      callbackerr(dberr);
    }
    else{//正常取回数据 写入redis 并返回
      if(data.length>0){
      	callback(data);
      }
      else{
        callback(JSON.parse('[]'));
      }
    }
  });
}  

/*
通过WorkId获取                                
*/
function SaveByWorkId(userworkjson,username,csdnid,callbackerr, callback) {
         var objuserwork = userworkjson;
         var workid = objuserwork.body.workid;
         var WorkBeginDate = objuserwork.body.workbegindate;
         var WorkEndDate = objuserwork.body.workenddate;
         var OrgID = objuserwork.body.orgid;
         var OrgName = objuserwork.body.orgname;
         var DepartName = objuserwork.body.departname;
         var Job = objuserwork.body.job;
         var WorkDesc = objuserwork.body.workdesc;

        var datacount = 0;
    
        var paramskeyvalue={ 'CSDNID': csdnid, 'WorkID': workid,'UserName':username, 'WorkBeginDate':WorkBeginDate,'WorkEndDate':WorkEndDate,'OrgID':OrgID,'OrgName':OrgName,'DepartName':DepartName,'Job':Job,'WorkDesc':WorkDesc};
        if (workid > 0) {
            var sql = "SELECT count(1) rowscount FROM userwork where CSDNID=@CSDNID And WorkID=@WorkID";
            var params = { 'CSDNID': csdnid, 'WorkID': workid };
            sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data) {
                if (dberr) { //数据库异常
                    callbackerr(dberr);
                } else { //正常取回数据 写入redis 并返回
                    for (var i = 0; i < data.length; i++) {
                        rowscount = data[i].rowscount;
                    }
                    //修改userinfo表工作经历状态
                    require('./userinfo').SetUserCheckStatus(csdnid,3
                        ,require('../appconfig').AuditWorkStatus.validAndUnChecked
                        ,function(err,count){});
                    rowscount = parseInt(rowscount);
                    if (rowscount > 0) {
                           //修改
                        var sqlupdate = "update userwork set CSDNID=@CSDNID,UserName=@UserName ";
                        if (WorkBeginDate) {
                            sqlupdate+= " , WorkBeginDate=@WorkBeginDate  ";
                        }
                        if (WorkEndDate || WorkEndDate == "") {
                            sqlupdate += ",WorkEndDate=@WorkEndDate ";
                        }
                        if (OrgID) {
                            sqlupdate += ", OrgID=@OrgID";
                        }
                         if (OrgName) {
                            sqlupdate += ", OrgName=@OrgName";
                        }
                        if (DepartName) {
                            sqlupdate += " , DepartName=@DepartName";
                        }
                          if (Job) {
                            sqlupdate += " , Job=@Job";
                        }
                          if (WorkDesc) {
                            sqlupdate += " , WorkDesc=@WorkDesc";
                        }
                              
                        sqlupdate += " where WorkID=@WorkID ";
                           sqlhelper.ExecuteDataTable("uc", sqlupdate, paramskeyvalue, function(dberr, data) {
                               if (dberr) { //数据库异常
                                   callbackerr(dberr);
                               } else {
				   callback(workid);
/**
                                   //callback(true);
                                   //处理project
                                   if (!objuserwork.body.projectexp || objuserwork.body.projectexp.length == 0) {
                                       callback(workid);
                                   }
                                   else{
                                       for (var j = 0; j < objuserwork.body.projectexp.length; j++) {
                                           var ProjectID = objuserwork.body.projectexp[j].projectid;
                                           // var WorkID = objuserwork.body.projectexp[j].workid;
                                           var StartDate = objuserwork.body.projectexp[j].startdate;
                                           var EndDate = objuserwork.body.projectexp[j].enddate;
                                           var ProjectName = objuserwork.body.projectexp[j].projectname;
                                           var ProjectDesc = objuserwork.body.projectexp[j].projectdesc;
                                           var ProjectJob = objuserwork.body.projectexp[j].projectjob;
                                           var paramsProjectkeyvalue = { 'CSDNID': csdnid, 'WorkID': workid, 'ProjectID': ProjectID, 'UserName': username, 'StartDate': StartDate, 'EndDate': EndDate, 'ProjectName': ProjectName, 'ProjectDesc': ProjectDesc, 'ProjectJob': ProjectJob };

                                           if (ProjectID > 0) {
                                               sql = " update userproject set " +
                                                   " WorkID=@WorkID,CSDNID=@CSDNID,UserName=@UserName";
                                               if (StartDate) {
                                                   sql += ",StartDate=@StartDate";
                                               }
                                               if (EndDate) {
                                                   sql += ",EndDate=@EndDate";
                                               }
                                               if (ProjectName) {
                                                   sql += ",ProjectName=@ProjectName";
                                               }
                                               if (ProjectDesc) {
                                                   sql += ",ProjectDesc=@ProjectDesc";
                                               }
                                               if (ProjectJob)
                                               {
                                                   sql += ",ProjectJob=@ProjectJob";
                                               }

                                               sql += " where ProjectID=@ProjectID";

                                               sqlhelper.ExecuteDataTable("uc", sql, paramsProjectkeyvalue, function(dberr, data) {
                                                   if (dberr) { //数据库异常
                                                       callbackerr(dberr);
                                                   } else { //正常取回数据 写入redis 并返回
                                                       //成功了
                                                       datacount++;
                                                       if (datacount == objuserwork.body.projectexp.length) {
                                                           callback(workid);
                                                       }
                                                   }
                                               });
                                           } else {
                                               //新增
                                               var sql = "insert into userproject(" +
                                                   "WorkID,CSDNID,UserName";
                                               if (StartDate) {
                                                   sql += ",StartDate";
                                               }

                                               if (EndDate) {
                                                   sql += ",EndDate";
                                               }

                                               if (ProjectName) {
                                                   sql += ",ProjectName";
                                               }

                                               if (ProjectDesc) {
                                                   sql += ",ProjectDesc";
                                               }

                                               if (ProjectJob) {
                                                   sql += ",ProjectJob";
                                               }

                                               sql += ")values(" +
                                                   "@WorkID,@CSDNID,@UserName";

                                               if (StartDate) {
                                                   sql += ",@StartDate";
                                               }
                                               if (EndDate) {
                                                   sql += ",@EndDate";
                                               }
                                               if (ProjectName) {
                                                   sql += ",@ProjectName";
                                               }
                                               if (ProjectDesc) {
                                                   sql += ",@ProjectDesc";
                                               }
                                               if (ProjectJob) {
                                                   sql += ",@ProjectJob";
                                               }

                                               sql += ")";
                                               sqlhelper.ExecuteDataTable("uc", sql, paramsProjectkeyvalue, function(dberr, data) {
                                                   if (dberr) { //数据库异常
                                                       callbackerr(dberr);
                                                   } else { //正常取回数据 写入redis 并返回
                                                       //成功了
                                                       datacount++;
                                                       if (datacount == objuserwork.body.projectexp.length || objuserwork.body.projectexp.length == 0) {
                                                           callback(workid);
                                                       }
                                                   }
                                               });
                                           }
                                       }
                                   }
**/
                                   }
                           });
                    }
                    else{
                        callbackerr('改用户没找到对应workid');
                    }
                }
            });
        } else {
            //新增
            var sqlinsert = "insert into userwork(" +
                "CSDNID,UserName";
                if(WorkBeginDate) {
                    sqlinsert += ",WorkBeginDate";
                }
                if(WorkEndDate) {
                    sqlinsert += ",WorkEndDate";
                }
                if(OrgID) {
                    sqlinsert += ",OrgID";
                }
                if(OrgName) {
                    sqlinsert += ",OrgName";
                }
                if(DepartName) {
                    sqlinsert += ",DepartName";
                }
                 if(Job) {
                    sqlinsert += ",Job";
                }
                if(WorkDesc) {
                    sqlinsert += ",WorkDesc";
                }
            sqlinsert += ",Status";

            sqlinsert+=")values(" +
                "@CSDNID,@UserName";
                if(WorkBeginDate) {
                    sqlinsert += ",@WorkBeginDate";
                }
            
                 if(WorkEndDate) {
                    sqlinsert += ",@WorkEndDate";
                }
            
                 if(OrgID) {
                    sqlinsert += ",@OrgID";
                }
                 if(OrgName) {
                    sqlinsert += ",@OrgName";
                }
                 if(DepartName) {
                    sqlinsert += ",@DepartName";
                }
                if(Job) {
                    sqlinsert += ",@Job";
                }
                if(WorkDesc) {
                    sqlinsert += ",@WorkDesc";
                }
            sqlinsert += "," + require('../appconfig').businessStauts.normal;
                sqlinsert += ")";
               sqlhelper.ExecuteInsert("uc", sqlinsert, paramskeyvalue, function(dberr, data) {
			if (dberr) { //数据库异常
                        	callbackerr(dberr);
                        } else { //正常取回数据 写入redis 并返回
                        	if(data<1){
                                	callbackerr('工作经历保存不成功');
                                }
                                else{
                               		workid=data;
					callback(workid);
					//修改userinfo表工作经历状态
					require('./userinfo').SetUserCheckStatus(csdnid,3
                                        	,require('../appconfig').AuditWorkStatus.validAndUnChecked
                                                ,function(err,count){});
                                }
				/**
                                                     //if (!objuserwork.body.projectexp || objuserwork.body.projectexp.length==0) {
                                                            callback(workid);
                                                      }
                                                    else{
                                                         //修改userinfo表工作经历状态
                                                         require('./userinfo').SetUserCheckStatus(csdnid,3
                                                             ,require('../appconfig').AuditWorkStatus.validAndUnChecked
                                                             ,function(err,count){});
                                                         //开始新增project
                                                         for (var j = 0; j < objuserwork.body.projectexp.length; j++) {
                                                             var ProjectID = objuserwork.body.projectexp[j].projectid;
                                                             var WorkID =data.insertId;//返回新增的id
                                                             var StartDate = objuserwork.body.projectexp[j].startdate;
                                                             var EndDate = objuserwork.body.projectexp[j].enddate;
                                                             var ProjectName = objuserwork.body.projectexp[j].projectname;
                                                             var ProjectDesc = objuserwork.body.projectexp[j].projectdesc;
                                                             var ProjectJob = objuserwork.body.projectexp[j].projectjob;
                                                             var paramsProjectkeyvalue = { 'UserCSDNID': csdnid, 'WorkID': WorkID,'ProjectID':ProjectID,'UserName':username,'StartDate':StartDate,'EndDate':EndDate,'ProjectName':ProjectName,'ProjectDesc':ProjectDesc,'ProjectJob':ProjectJob};

                                                             if (ProjectID > 0) {
                                                                 sql = " upate userproject set " +
                                                                     " WorkID=@WorkID,CSDNID=@CSDNID,UserName=@UserName";
                                                                 if (StartDate) {
                                                                     sql+=",StartDate=@StartDate";
                                                                 }
                                                                 if (EndDate) {
                                                                     sql+=",EndDate=@EndDate";
                                                                 }
                                                                 if (ProjectName) {
                                                                     sql+=",ProjectName=@ProjectName";
                                                                 }
                                                                 if (ProjectDesc) {
                                                                     sql+=",ProjectName=@ProjectDesc";
                                                                 }
                                                                 if (ProjectJob) {
                                                                     sql+=",ProjectJob=@ProjectJob";
                                                                 }
                                                                 sql+= " where ProjectID=@ProjectID";

                                                                 sqlhelper.ExecuteDataTable("uc", sql, paramsProjectkeyvalue, function(dberr, data) {
                                                                     if (dberr) { //数据库异常
                                                                         callbackerr(dberr);
                                                                     } else { //正常取回数据 写入redis 并返回
                                                                         //成功了
                                                                         datacount++;
                                                                         if (datacount == objuserwork.body.projectexp.length || objuserwork.body.projectexp.length==0) {
                                                                             callback(workid);
                                                                         }
                                                                     }
                                                                 });
                                                             }
                                                             else {
                                                                 //新增
                                                                 var sql = "insert into userproject(" +
                                                                     "WorkID,CSDNID,UserName";
                                                                 if (StartDate) {
                                                                     sql += ",StartDate";
                                                                 }
                                                                 if (EndDate) {
                                                                     sql += ",EndDate";
                                                                 }

                                                                 if (ProjectName) {
                                                                     sql += ",ProjectName";
                                                                 }
                                                                 if (ProjectDesc) {
                                                                     sql += ",ProjectDesc";
                                                                 }
                                                                 if (ProjectJob) {
                                                                     sql += ",ProjectJob";
                                                                 }

                                                                 sql += ")values(" +
                                                                     "@WorkID,@UserCSDNID,@UserName";
                                                                 if (StartDate) {
                                                                     sql += ",@StartDate";
                                                                 }
                                                                 if (EndDate) {
                                                                     sql += ",@EndDate";
                                                                 }
                                                                 if (ProjectName) {
                                                                     sql += ",@ProjectName";
                                                                 }
                                                                 if (ProjectDesc) {
                                                                     sql += ",@ProjectDesc";
                                                                 }
                                                                 if (ProjectJob) {
                                                                     sql += ",@ProjectJob";
                                                                 }
                                                                 sql += ")";
                                                                 sqlhelper.ExecuteDataTable("uc", sql, paramsProjectkeyvalue, function(dberr, data) {
                                                                     if (dberr) { //数据库异常
                                                                         callbackerr(dberr);
                                                                     } else { //正常取回数据 写入redis 并返回
                                                                         //成功了
                                                                         datacount++;
                                                                         if (datacount == objuserwork.body.projectexp.length ||objuserwork.body.projectexp.length==0) {
                                                                             callback(workid);
                                                                         }
                                                                     }
                                                                 });
                                                             }
                                                         }
                                                     }
                                                }
**/
				}
			});
        }
       
}

function deleteWorkExp(CSDNID,WorkID,callback){
    var sql = 'update userwork set Status=' + require('../appconfig').businessStauts.delete + ' where CSDNID=@CSDNID and WorkID=@WorkID';
    var params = {'CSDNID':CSDNID,'WorkID':WorkID};
    sqlhelper.ExecuteNoQuery('uc',sql,params
        ,function(err,Count){
            if(err){
                callback(err,null);
            }
            else{
                if(Count>0){
                    callback(null,Count);
                }
                else{
                    callback('修改不成功',null);
                }
            }
        }
    );
}

exports.GetByCSDNIDModule = GetByCSDNID;

exports.SaveByWorkIdModule = SaveByWorkId;

exports.DeleteWorkExp = deleteWorkExp;
