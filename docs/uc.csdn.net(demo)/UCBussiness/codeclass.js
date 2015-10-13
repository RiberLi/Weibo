/**
 * Created by Liujunjie on 13-11-26.
 */

var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
var ConTime = require('../Utility/time')();

function getlist(callbackerr, callback){
    var list = '';
    var sql = "SELECT * FROM CodeClass WHERE IsVisible=1";
    var params = {};
    sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
        if(dberr){//数据库异常
            callbackerr(dberr);
        }
        else{//正常取回数据
            callback(data);
        }

    });
}

function getlistbyclassid(classid, callbackerr, callback){
    var list = '';
    var sql = "SELECT * FROM CodeItem WHERE ClassID=@classid and IsVisible=1";
    var params = {'classid': classid};
    sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
        if(dberr){//数据库异常
            callbackerr(dberr);
        }
        else{//正常取回数据 写入redis 并返回
            callback(data);
        }
    });
}

function getbyclasscodeid(classid, codeid, callbackerr, callback){
    var json = '';
    var sql = "SELECT * FROM CodeItem WHERE ClassID=@classid and CodeID=@CodeID and IsVisible=1";
    var params = {'classid': classid, 'CodeID': codeid};
    sqlhelper.ExecuteDataRow("uc", sql, params,function(dberr, data){
        if(dberr){
            callbackerr(dberr);
        }
        else{
            callback(data);
        }
    });
}


function savelist(params, callbackerr, callback){

	var items = [
		'ClassID',
		'ClassNameCn',
		'ClassNameEn'
	];
	var sql = '';
	var sqlparams = {};

	if(params.classid>0){

		for(var codeclass in params){
			for(var i=0 ; i<items.length ; i++){
				if(items[i].toLocaleLowerCase() === codeclass){
					if(sql === ''){
						sql = 'UPDATE CodeClass set '
					}
					else{
						sql += ',';
					}
					sql += items[i] + '=@' + items[i];
					sqlparams[items[i]] = params[codeclass];	
				}
			}
		}
		if(sql===''){
			callback(params.classid);
		}
		else{
			//修改version和最后更新时间
			var params2 = {};
			var sql2 = 'SELECT Version FROM CodeClass WHERE ClassID=@ClassID';
                        params2['ClassID'] = params.classid;
                        sqlhelper.ExecuteDataTable("uc", sql2, params2, function(dberr, data){
                        	if(dberr){
	                                callbackerr(dberr);
                                }
       	                        else{
                           		var version = data[0]['Version'] + 1;
                                        var lastupdatedate = ConTime.now();
					var Version = 'Version';
					sql += ',';
					var LastUpdateDate = 'LastUpdateDate';
				        sql += Version + '=@' + Version;
					sql += ',';
				        sql += LastUpdateDate + '=@' + LastUpdateDate;
				        sqlparams['Version'] = version;
				        sqlparams['LastUpdateDate'] = lastupdatedate;
                                     
				     	sql += ' WHERE ClassID=@ClassID'
					sqlparams['ClassID'] = params.classid;
					sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
						if(dberr){
							callbackerr(dberr);
						}	
						else{
							if(Count>0){
								callback(params.classid);
							}
							else {
								callbackerr('保存失败，影响行数为0');
							}
						}
					}); 				
				
				}	
			});
		}
	}
	else if(params.classid==0){

		//添加insert
		var fields = '(';
		var values = '(';
		sql = 'INSERT INTO CodeClass '
		for(var codeclass in params){
			for(var i=0 ; i<items.length ; i++){
				if(items[i].toLocaleLowerCase() === codeclass){
					fields += items[i];
					values += '@' + items[i];
					fields += ',';
					values += ',';
					sqlparams[items[i]] = params[codeclass];
				}
			}
		}
		var Version = 'Version';
		var LastUpdateDate = 'CreateDate';
		fields += Version;
		fields += ',';
		values += '@' + Version;
		values += ',';
		fields += LastUpdateDate;
		values += '@' + LastUpdateDate;
		sqlparams['Version'] = 1;
		sqlparams['CreateDate'] = ConTime.now();
		fields += ')';
		values += ')';
		sql += fields + ' VALUES ' + values;
		sqlhelper.ExecuteInsert('uc', sql, sqlparams, function(dberr, ID){
			if(dberr){
				 callbackerr(dberr);
			}
			else {
				 callback(ID);
			}
		});
	}
	else{
		callbackerr('没找到对应字典信息');
	}
}


function savebyclasscodeid(params,callbackerr, callback){

	var items = [
		'ClassID',
		'CodeID',
		'CodeNameCn',
		'CodeNameEn',
		'Lvl',
		'ParentID',
		'HasChild'
	];

	var sql = '';
	var sqlparams = {};
	if(params.option==1){
		for(var codeitem in params){
			for(var i=0 ; i<items.length ; i++){
				if(items[i].toLocaleLowerCase() === codeitem){
					if(sql === ''){
						sql = 'UPDATE CodeItem set '
					}
					else{
						sql += ',';
					}
					sql += items[i] + '=@' + items[i];
					sqlparams[items[i]] = params[codeitem];
				}
			}
		}
		if(sql===''){
			callbackerr('没有信息需要更新');
		}
		else{

			//添加LastUpdateDate信息

			var LastUpdateDate = 'LastUpdateDate';
			var lastupdatedate = ConTime.now();
			sql += ',';
			sql += LastUpdateDate + '=@' + LastUpdateDate;
			sqlparams['LastUpdateDate'] = lastupdatedate;
			
			sql += ' WHERE ClassID=@ClassID and CodeID = @CodeID'
			sqlparams['ClassID'] = params.classid;
			sqlparams['CodeID'] = params.codeid;
			sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
				if(dberr){
        	                        callbackerr(dberr);
                                }
				else {
					if(Count>0){
						callback(Count);
					}
					else{
						callbackerr('保存失败，影响行数为0');
					}
				}
				
			});
			
		}
		
	}
	else if(params.option == 2){
		//添加
		var fields = '(';
		var values = '(';
		sql = 'INSERT INTO CodeItem '
		for(var codeitem in params){
			for(var i=0 ; i<items.length ; i++){
				if(items[i].toLocaleLowerCase() === codeitem){
					fields += items[i];
					values += '@' + items[i];
					fields += ',';
					values += ',';
					sqlparams[items[i]] = params[codeitem];
				}
			}
		}
		//添加OrderNo,IsVisible, IsForbidden, RootID, SearchIDs, CreateDate, Path 等信息
			 var OrderNo = 'OrderNo';
			 var IsVisible = 'IsVisible';
                         var IsForbidden = 'IsForbidden';
                         var RootID = 'RootID';
                         var SearchIDs = 'SearchIDs';
                         var CreateDate = 'CreateDate';
                         var Path = 'Path';
 			 var orderno = params.codeid;
                         var isvisible = 1;
                         var isforbidden = 0;
                         var rootid = 0;
                         var createdate = ConTime.now();
			 if(params.parentid == ""){
				 params.parentid = 0;
			 }
                         if(params.parentid==0){
                                 var searchids = params.codeid;
                                 var path = params.codeid;
                         }
                         else {
                                 var searchids = String(params.parentid)+String(params.codeid);
				 var path = String(params.parentid)+String(params.codeid);
                         }
			 fields += OrderNo;
			 fields += ',';
			 values += '@' + OrderNo;
			 values += ',';
			 fields += IsVisible;
			 fields += ',';
			 values += '@' + IsVisible;
			 values += ',';
			 fields += IsForbidden;
			 fields += ',';
			 values += '@' + IsForbidden;
			 values += ',';
			 fields += RootID;
			 fields += ',';
			 values += '@' + RootID;
			 values += ',';
			 fields += SearchIDs;
			 fields += ',';
			 values += '@' + SearchIDs;
			 values += ',';
			 fields += CreateDate;
			 fields += ',';
			 values += '@' + CreateDate;
			 values += ',';
			 fields += Path;
			 values += '@' + Path;
			 
			 sqlparams['OrderNo'] = orderno;          
                         sqlparams['IsVisible'] = isvisible;
                         sqlparams['IsForbidden'] = isforbidden;
                         sqlparams['RootID'] = rootid;
                         sqlparams['SearchIDs'] = searchids;
                         sqlparams['CreateDate'] = createdate;
                         sqlparams['Path'] = path;
			 
			fields += ')';
			values += ')';
			sql += fields + ' VALUES ' + values;
			sqlhelper.ExecuteInsert('uc', sql, sqlparams, function(dberr, data){
				if(dberr){
                                	 callbackerr(dberr);
                       		}
				else{
					 callback(data);
				}
			});		
	}
	else {
		callbackerr('没找到对应字典信息');
	}

}

function deletelist(params, callbackerr, callback){
	var sql = 'UPDATE CodeClass set IsVisible=0 WHERE ClassID=@ClassID';
	var sqlparams = {}; 
	sqlparams['ClassID'] = params.classid;
	sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
		if(dberr){
			 callbackerr(dberr);
		}
		else {
			if(Count>0){
				 callback(params.classid);
			}
			else{
				callbackerr('保存失败，影响行数为0');
			}
		}
	}); 
}

function deleteitembyclasscodeid(params, callbackerr, callback){
	var sql = 'UPDATE CodeItem set IsVisible=0 WHERE ClassID=@ClassID and CodeID=@CodeID';
        var sqlparams = {};
        sqlparams['ClassID'] = params.classid;
	sqlparams['CodeID'] = params.codeid;
        sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
                if(dberr){
                         callbackerr(dberr);
                }
                else {
                        if(Count>0){
                                 callback(params.codeid);
                        }
                        else{
                                callbackerr('保存失败，影响行数为0');
                        }
                }
        });
}

exports.GetListModule = getlist;

exports.SaveList = savelist;

exports.DeleteList = deletelist;

exports.GetListByClassIDModule = getlistbyclassid;

exports.GetByClassCodeIDModule = getbyclasscodeid;

exports.SaveItem = savebyclasscodeid;

exports.DeleteItem = deleteitembyclasscodeid;
