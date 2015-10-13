/**
 * Created by Liujunjie on 13-11-26.
 */

var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
var async = require('async');



//获取技能信息
function getbyid(CSDNID,username,callbackerr, callback){
    		var sql = "SELECT * FROM userskill WHERE CSDNID=@CSDNID and FromBI=@FromBI order by skillLevel desc";
    		var params = {'CSDNID': CSDNID,'FromBI':0}
    		sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
        		if(dberr){//数据库异常
            			callbackerr(dberr);
        		}
        		else{//正常取回数据
      	    			callback(data);
        		}
    		});
 }

//获取系统推荐技能
function getsysbyid(CSDNID,username,callbackerr, callback){
	var sql = "SELECT * FROM userskill WHERE CSDNID=@CSDNID and FromBI=@FromBI order by SkillDegree desc";
        var params = {'CSDNID': CSDNID,'FromBI':1}
        sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
        	if(dberr){//数据库异常
 	               callbackerr(dberr);
                }
                else{//正常取回数据
                	callback(data);
                }
        });
} 

//保存技能信息
function savebyskillid(CSDNID, params, callbackerr, callback){
    var items = [
        //'EduID',
        'SkillType',
        'SkillName',
        'UsedTime',
        'SkillLevel',
	'FromBI',
        'SkillDes'
//        ,'EndorserCSDNIDs',
//        'EndorserUserNames'
    ];
    var sql = '';
    var sqlparams = {};
    if(params.skillid>0){
        //update
        for(var skill in params){
            for(var i=0 ; i<items.length ; i++){
                if(items[i].toLocaleLowerCase() === skill){
                    if(sql === ''){
                        sql = 'UPDATE userskill set '
                    }
                    else{
                        sql += ',';
                    }
                    sql += items[i] + '=@' + items[i];
                    sqlparams[items[i]] = params[skill];
                }
            }
        }
        if(sql===''){
            callbackerr('没有可保持信息');
        }
        else{
            sql += ' WHERE SkillID=@SkillID and CSDNID=@CSDNID'
            sqlparams['SkillID'] = params.skillid;
            sqlparams['CSDNID'] = CSDNID;
            sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
                    if(dberr){
                        callbackerr(dberr);
                    }
                    else{
                        if(Count>0){
                            callback(params.skillid);
                            //修改userinfo表技能状态
                            require('./userinfo').SetUserCheckStatus(CSDNID,2
                                ,require('../appconfig').AuditSkillStatus.validAndUnChecked
                                ,function(err,count){});
                        }
                        else{
                            callbackerr('保存失败，影响行数为0');
                        }
                    }
                }
            );
        }
    }
    else if(params.skillid==0){
        //insert
        var fields = '';
        var values = '';
        sql = 'INSERT INTO userskill '
        fields = '(CSDNID,UserName,EndorserCSDNIDs,EndorserUserNames,Status';
        values = '(@CSDNID,@UserName,@EndorserCSDNIDs,@EndorserUserNames,'+require('../appconfig').businessStauts.normal;
  
        for(var skill in params){
            for(var i=0 ; i<items.length ; i++){
                if(items[i].toLocaleLowerCase() === skill){
                    fields += ',';
                    values += ',';
                    fields += items[i];
                    values += '@' + items[i]
                    sqlparams[items[i]] = params[skill];
       		    
                }
            }
        }
	var async = require('async');
	async.waterfall([
		function(cb){
			require("../routes/userskill").GetSkillByid(CSDNID,params.username,function(err,skilllist){
				if(err){
					cb(err,null);
				}
				else{
					var SkillFlag = true;
					for(var i=0;i<skilllist.length;i++){
						if(skilllist[i].SkillName===sqlparams['SkillName'] && skilllist[i].FromBI===0 && skilllist[i].Status===0){
							SkillFlag = false;
							break;
						}
					}
				}
				cb(null,SkillFlag)
			});
		},
		function(arg1,cb){
			if(arg1===false){
				cb('已有该技能',null)
			}
			else{
				require("../routes/userskill").GetSysSkillByid(CSDNID,params.username,function(err,sysskilllist){
                                	if(err){
                                        	cb(err,null,null);
                                	}
                                	else{
                                        	var sysSkillFlag = true;
						var sysSkillID = 0;
                                        	for(var i=0;i<sysskilllist.length;i++){
                                                	if(sysskilllist[i].SkillName===sqlparams['SkillName'] && sysskilllist[i].FromBI===1 && sysskilllist[i].Status===0){
                                                		sysSkillFlag = false;
								sysSkillID = sysskilllist[i].SkillID;
                                                		break;
							}
                                        	}
                                	}
					cb(null,sysSkillFlag,sysSkillID);
                        	});
			}
		},
		function(arg1,arg2,cb){
			if(arg1===false){
				var sqlupdate = 'UPDATE userskill set FromBI=@FromBI,SkillLevel=@SkillLevel where SkillID=@SkillID ';
				var paramsupdate = {'FromBI':0,'SkillLevel':params.skilllevel,'SkillID':arg2};
				sqlhelper.ExecuteNoQuery('uc', sqlupdate, paramsupdate, function(dberr, Count){
					if(dberr){
						cb(dberr,null);
					}
					else{
						if(Count>0){
							cb(null,arg2);
							PushUsername4BI(params.username,function(err){
							},function(data){
							});
						}
						else{
							cb('保存失败，影响行数为0',null);
						}
					}
				});
			}
			else{
				fields += ')';
				values += ')';
                                sqlparams['CSDNID'] = CSDNID;
                                sqlparams['UserName'] = params.username;
                                sqlparams['EndorserUserNames'] = '';
                                sqlparams['EndorserCSDNIDs'] = '';
                                sql += fields + ' VALUES ' + values;
                                sqlhelper.ExecuteInsert('uc', sql, sqlparams, function(dberr, ID){
                                	if(dberr){
                                        	cb(dberr,null);
                                        }
                                        else{
                                        	cb(null,ID);
                                               //修改userinfo表技能状态
                                               require('./userinfo').SetUserCheckStatus(CSDNID,2
                                               ,require('../appconfig').AuditSkillStatus.validAndUnChecked
                                               ,function(err,count){});
                                               PushUsername4BI(params.username,function(err){
                                               },function(data){
                                               });
                                        }
                                });	
			}
		}
	],function(err,result){
		if(err){
			callbackerr(err);
		}
		else{
			callback(result)
		}
	});
    }
    else{
        callbackerr('无效skillid');
    }
}

//赞
function endorser(CSDNID,skillid,endorid,endorun, callback){
    var updataSQL = 'UPDATE userskill SET EndorserCSDNIDs=CONCAT(EndorserCSDNIDs,@EndorserCSDNIDs)'
        + ',EndorserUserNames=CONCAT(EndorserUserNames,@EndorserUserNames)'
        + ' WHERE SkillID=@SkillID AND CSDNID=@CSDNID;'
    var params = {'CSDNID':CSDNID,'SkillID':skillid,'EndorserUserNames':','+endorun,'EndorserCSDNIDs':','+endorid};
    sqlhelper.ExecuteNoQuery('uc',updataSQL,params,function(err,Count){
            if(err){
                callback(err,0);
            }
            else{
                callback(null,Count);
            }
        }
    );
}

function PushUsername4BI(username,callback){
	//当技能添加时，向BI通知username
        if(username){
        	var pushparams = {};
                pushparams["u"] = username;
                var hr = require('../Utility/httprequest')();
                var pushurl = require("../appconfig").uc_to_myapi.changeperson;
		//var pushurl = "http://b2d.dm.csdn.net:9403/person/update_index";
                var token = require("../appconfig").uc_to_myapi.TOKEN;
		//var token = "";
                hr.getData(pushurl, 'GET', pushparams, token, function(err) {
			callback(err);
                },function(body) {
			callback(1);
                });
        }
}

function deletebycsdnid(CSDNID,username,skillid,callback){
    var sql = 'UPDATE userskill set Status=@Status where SkillID=@SkillID and CSDNID=@CSDNID'
    var sqlparams = {'SkillID':skillid,'CSDNID':CSDNID,'Status':require('../appconfig').businessStauts.delete};
    sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
            if(dberr){
                callback(dberr,null);
            }
            else{
                if(Count>0){
                    callback(null, skillid);
                    PushUsername4BI(username,function(err){
                                                                                        
                    },function(data){
		    
		    });

		}
                else{
                    callback('保存失败，影响行数为0', null);
                }
            }
        }
    );
}

exports.GetbyIDModule = getbyid;
exports.GetSysbyIDModule = getsysbyid;
exports.SaveBySkillID = savebyskillid;
exports.Endorser = endorser;
exports.DeleteByCSDNID = deletebycsdnid;
