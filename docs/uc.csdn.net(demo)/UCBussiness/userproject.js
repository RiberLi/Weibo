var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
var ConTime = require('../Utility/time')();

//获取项目经验
function getbycsdnid(csdnid,callbackerr,callback){
	var sql = 'SELECT * From userproject WHERE CSDNID=@CSDNID and Status=@Status ';
	var params = {'CSDNID':csdnid,'Status':require('../appconfig').businessStauts.normal};
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

//添加，修改项目经验
function savebycsdnid(csdnid,username,projectid,params,callbackerr,callback){
	var items = ['ProjectType','StartDate','EndDate','ProjectName','ProjectDesc','ProjectJob','ProjectRef','FromSystem'];
	var sql = '';
	var sqlparams = {};
	if(projectid>0){
		//update
		for(var pro in params){
			for(var i=0; i<items.length;i++){
				if(items[i].toLocaleLowerCase() === pro){
					if(sql === ''){
                                        	sql = 'UPDATE userproject set '
                                        }
                                        else{
                                        	sql += ',';
                                        }
                                        sql += items[i] + '=@' + items[i];
                                        sqlparams[items[i]] = params[pro];
				}
			}
		}
		if(sql===''){
			callback(projectid);
		}
		else{
			sql += ' WHERE ProjectID=@ProjectID and CSDNID=@CSDNID';
			sqlparams['ProjectID'] = projectid;
			sqlparams['CSDNID'] = csdnid;
			sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
				if(dberr){
					callbackerr(dberr);
				}
				else {
					if(Count>0){
						callback(projectid);
					}
					else {
						callbackerr('保存失败，影响行数为0');
					}
				}
			});
		}
	}
	else if(projectid === 0){
		//insert
		var fields = '';
                var values = '';
		sql = 'INSERT INTO userproject ';
		fields = '(CSDNID,UserName,Status';
		values = '(@CSDNID,@UserName,' + require('../appconfig').businessStauts.normal;
		var flag = false;
		for(var pro in params){
			for(var i=0 ; i<items.length ; i++){
                                if(items[i].toLocaleLowerCase() === pro){
                                        fields += ',';
                                        values += ',';
                                        fields += items[i];
                                        values += '@' + items[i]
                                        sqlparams[items[i]] = params[pro];
                                        flag = true;
                                }
                        }
		}
		fields += ')';
                values += ')';
                sqlparams['CSDNID'] = csdnid;
		sqlparams['UserName'] = username;
		sql += fields + ' VALUES ' + values;
		if(flag==true){
			sqlhelper.ExecuteInsert('uc', sql, sqlparams, function(dberr, ID){
				console.log(dberr)
				if(dberr){
                                        callbackerr(dberr);
                                }
                                else{
                                        callback(ID);

				}
			});
		}
		else {
			callbackerr('没有可插入数据');
		}
	}
	else {
		callbackerr('没找到对应项目信息');
	}	
}

function deleteproject(csdnid,projectid,callbackerr,callback){
	var sql = "UPDATE userproject set Status=@Status WHERE CSDNID=@CSDNID and ProjectID=@ProjectID";
	var sqlparams = {'Status':require('../appconfig').businessStauts.delete,'CSDNID':csdnid,'ProjectID':projectid};
	sqlhelper.ExecuteNoQuery('uc',sql,sqlparams,function(err,Count){
		if(err){
                	callbackerr(err);
            	}
		else {
			if(Count>0){
				callback(Count);
			}
			else {
				callbackerr('修改不成功');
			}
		}
	});
}

exports.GetByCSDNID = getbycsdnid;
exports.SaveByCSDNID = savebycsdnid;
exports.DeleteProjectByID = deleteproject;
