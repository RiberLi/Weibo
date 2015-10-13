/**
 * Created by Liujunjie on 13-12-5.
 */

var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);

//取得教育经历
function getedu(CSDNID, callbackerr, callback){
    var sql = 'SELECT * FROM useredu WHERE CSDNID=@CSDNID';
    var params ={'CSDNID': CSDNID};
    sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
        if(dberr){
            callbackerr(dberr);
        }
        else{
            if(data.length>0){
                callback(data);
            }
            else{
                callback(JSON.parse('[]'));
            }
        }
    });
}

//保存教育经历
function saveedu(CSDNID, params, callbackerr, callback){
    var items = [
        //'EduID',
        'EduStartDate',
        'EduEndDate',
//	'SchoolOrgID',
        'SchoolName',
        'Major',
	'MajorStr',
        'Degree',
	'UnivSystem'
    ];
	
			
	var sql = '';
	var sqlparams = {};
	if(params.eduid>0){
	//update
		 var flag = 0;
		 var status = 0;
		 require('../routes/usereduexp').getedu(CSDNID,function(dberr,data){
			 if(dberr){
				callbackerr(dberr);	
			 }
			 else{
				for(var k in data){
					if(data[k].EduID===params.eduid){
						flag = data[k].EduFlag;
						status = data[k].Status;
						break;
					}
				}
				if(status === 1){
					callbackerr("该教育经历已删除，不能修改");		
				}
				else if(!flag){
					for(var edu in params){
						for(var i=0 ; i<items.length ; i++){
							if(items[i].toLocaleLowerCase() === edu){
								if(sql === ''){
									sql = 'UPDATE useredu set '
								}
								else{
									sql += ',';
								}
								sql += items[i] + '=@' + items[i];
								sqlparams[items[i]] = params[edu];
							}	
						}	
					}
					if(sql===''){
						callback(params.eduid);
					}
					else{
						sql += ' WHERE EduID=@EduID and CSDNID=@CSDNID'
						sqlparams['EduID'] = params.eduid;
						sqlparams['CSDNID'] = CSDNID;
						sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
							if(dberr){
								callbackerr(dberr);
							}
							else{
								if(Count>0){
									callback(params.eduid);
									//修改userinfo表教育状态
									require('./userinfo').SetUserCheckStatus(CSDNID,1
									,require('../appconfig').AuditEduStatus.validAndUnChecked
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
				else {
						callbackerr("该教育经历已认证，不能修改");
				}
			}
		});
	}
	else if(params.eduid==0){
		//insert
		var fields = '';
		var values = '';
		sql = 'INSERT INTO useredu '
		fields = '(CSDNID,UserName,Status';
		values = '(@CSDNID,@UserName,' + require('../appconfig').businessStauts.normal;
		var flag = false;	
		for(var edu in params){
			for(var i=0 ; i<items.length ; i++){
				if(items[i].toLocaleLowerCase() === edu){
					fields += ',';
					values += ',';
					fields += items[i];
					values += '@' + items[i]
					sqlparams[items[i]] = params[edu];
					flag = true;	
				}
			}
		}
		fields += ')';
		values += ')';
		sqlparams['CSDNID'] = CSDNID;
		sqlparams['UserName'] = params.username;
		sql += fields + ' VALUES ' + values;
		if(flag==true){
			sqlhelper.ExecuteInsert('uc', sql, sqlparams, function(dberr, ID){
				if(dberr){
					callbackerr(dberr);
				}
				else{
					callback(ID);
					//修改userinfo表教育状态
					require('./userinfo').SetUserCheckStatus(CSDNID,1
					,require('../appconfig').AuditEduStatus.validAndUnChecked
					,function(err,count){});
				}
			});
		}
		else{
			callbackerr('没有可插入数据');
		}
	}
	else{
		 callbackerr('没找到对应教育信息');
	}

}

function deletebycsdnid(CSDNID,eduid,eduflag,callback){
	if(eduflag==0){
		var sql = 'UPDATE useredu set Status=@Status where EduID=@EduID and CSDNID=@CSDNID'
		var sqlparams = {'EduID':eduid,'CSDNID':CSDNID,'Status':require('../appconfig').businessStauts.delete};
		sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
      	  		if(dberr){
                      		callback(dberr,null);
            		}
            		else{
                		if(Count>0){
                    			callback(null, eduid);
                		}
                		else{
                    			callback('保存失败，影响行数为0', null);
               			}
            		}
        	});
	}
	else{
		callback('该教育经历已认证,不允许删除');
	}
}

function deleteeduexp(CSDNID,eduid,callback){
    var sql = 'UPDATE useredu set Status=@Status where EduID=@EduID and CSDNID=@CSDNID'
    var sqlparams = {'EduID':eduid,'CSDNID':CSDNID,'Status':require('../appconfig').businessStauts.delete};
    sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
            if(dberr){
                callback(dberr,null);
            }
            else{
                if(Count>0){
                    callback(null, eduid);
                }
                else{
                    callback('保存失败，影响行数为0', null);
                }
            }
        }
    );
}

function saveeduflag(CSDNID,params,callbackerr, callback){
    
    if(params.eduflag==0 || params.eduflag==1){
    var items = 'EduFlag';
    var sqlparams = {};
    var sql = 'UPDATE useredu set '+items+'=@'+items;
    sql += ' WHERE EduID=@EduID and CSDNID=@CSDNID';
    sqlparams[items] = params[items.toLocaleLowerCase()];
    sqlparams['EduID'] = params.eduid;
    sqlparams['CSDNID'] = CSDNID;
    sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
	
    	if(dberr){
		callbackerr(dberr);
	}
	else{
		if(Count>0){
			callback(params.eduid);
		}
		else{
			callbackerr('保存失败，影响行数为0');
		}
	}	 
    });
    }
    else{
	callbackerr('认证失败');	
    }

}

exports.GetEdu = getedu;
exports.SaveEdu = saveedu;
exports.DeleteByCSDNID = deletebycsdnid;
exports.DeleteEduExp = deleteeduexp;
exports.SaveEduFlag = saveeduflag;
