var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
var paramshelper = require('../Utility/checkparam')();
var RedisClent = require('../Utility/Redis')();
var time = require('../Utility/time')();

function getuserblogbycsdnid(CSDNID,callbackerr,callback){
	var sql = "SELECT * FROM userblog WHERE CSDNID=@CSDNID ";
	var params = {'CSDNID':CSDNID};
	sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
        	if(dberr){//数据库异常
            		callbackerr(dberr);
        	}
        	else{//正常取回数据
            		callback(data);
        	}
    	});
}

function saveuserblogbycsdnid(CSDNID,UserName,BlogType,params,callbackerr,callback){
	var items = ['BlogName','BlogUrl'];
	var sql = "SELECT BlogID FROM userblog WHERE CSDNID=@CSDNID and BlogType=@BlogType";
	var sqlparams = {'CSDNID':CSDNID,'BlogType':BlogType};
	sqlhelper.ExecuteDataTable("uc", sql, sqlparams, function(dberr, data){
		if(dberr){
			callbackerr(dberr);	
		}
		else {
			if(data.length>0){
				//update
				var sql_update = '';
				var params_update = {};
				for(var blog in params){
					for(var i=0 ; i<items.length ; i++){
						if(items[i].toLocaleLowerCase() === blog){
							if(sql_update == ''){
								sql_update = 'UPDATE userblog set '
							}
							else {
								sql_update += ',';
							}
							sql_update += items[i] + '=@' + items[i];
							params_update[items[i]] = params[blog];			
						}
					}
				}
				sql_update += ' ,UpdateDate=@UpdateDate WHERE BlogID=@BlogID';
				params_update['UpdateDate'] = time.now();
				params_update['BlogID'] = data[0].BlogID;
				sqlhelper.ExecuteNoQuery('uc', sql_update, params_update, function(dberr, Count){
					if(dberr){
						callbackerr(dberr);
					}
					else {
						if(Count>0){
							callback(data[0].BlogID);
						}
						else {
							callbackerr('保存失败，影响行数为0');
						}		
					}
				});
			}
			else {
				//insert
				var sql_insert = '';
				var params_insert = {};
				var fields = '';
        			var values = '';
				for(var blog in params){
					for(var i=0; i<items.length ; i++){
						if(items[i].toLocaleLowerCase() === blog){
							if(sql_insert === ''){
								sql_insert = 'INSERT INTO userblog ';
								fields = '(';
								values = '(';
							}
							else {
								fields += ',';
								values += ',';
							}
							fields += items[i];
							values += '@' + items[i]
							params_insert[items[i]] = params[blog];
						}
					}
				}
				fields += ',CSDNID,UserName,BlogType,UpdateDate)';
				values += ',@CSDNID,@UserName,@BlogType,@UpdateDate)';
				params_insert['CSDNID'] = CSDNID;
				params_insert['UserName'] = UserName;
				params_insert['BlogType'] = BlogType;
				params_insert['UpdateDate'] = time.now();
				sql_insert += fields + ' VALUES ' + values;
				sqlhelper.ExecuteInsert('uc', sql_insert, params_insert, function(dberr, ID){
					if(dberr){
						callbackerr(dberr);
					}
					else {
						callback(ID);
					}
				});
			}
		}
	});
}

exports.getUserBlog = getuserblogbycsdnid;
exports.saveUserBlog = saveuserblogbycsdnid;
