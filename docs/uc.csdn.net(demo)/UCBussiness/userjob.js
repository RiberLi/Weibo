var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
var async = require('async');
var time = require('../Utility/time')();

function getbycsdnid(CSDNID,callbackerr,callback){
	var sql = "SELECT * FROM userjobinfo WHERE CSDNID=@CSDNID ";
	var sqlparams = {'CSDNID':CSDNID}
	sqlhelper.ExecuteDataTable("uc", sql, sqlparams, function(dberr, data){
		if(dberr){
			callbackerr(dberr);
		}
		else {
			callback(data);
		}
	});
}


function savebycsdnid(CSDNID,UserName,params,callbackerr,callback){
	var items = ['JobStatus','JobPost','JobType','JobSalary','JobProvince','JobCity','JobIndustry','JobComment'];
	var sqlcheck = 'SELECT CSDNID from userjobinfo where CSDNID=@CSDNID ';
	var sqlcheckparams = {'CSDNID':CSDNID};
	sqlhelper.ExecuteDataRow("uc", sqlcheck, sqlcheckparams, function(dberr, data){
		if(dberr){
			callbackerr(err)
		}
		else{
			if(!data){
				//insert
				var sql = "INSERT INTO userjobinfo "
				var sqlparams = {};
				var fields = '';
				var values = '';
				fields = '(CSDNID,UserName,CreateDate,LastUpdateDate';
				values = '(@CSDNID,@UserName,@CreateDate,@LastUpdateDate'
				var j=-1;
				for(var info in params){
					for(var i=0;i<items.length;i++){
						if(items[i].toLocaleLowerCase() === info.toLocaleLowerCase()){
							fields += ',';
							values += ',';
							fields += items[i];
							values += '@' + items[i]
							sqlparams[items[i]] = params[info];
							j++;
						}
					}
				}
				if(j===-1){
					callback(-1);
				}
				else {
					fields += ')';
					values += ')';
					sqlparams['CSDNID'] = CSDNID;
					sqlparams['UserName'] = UserName;
					sqlparams['CreateDate'] = time.now();
					sqlparams['LastUpdateDate'] = time.now();
					sql += fields + ' VALUES ' + values;
					sqlhelper.ExecuteDataRow('uc', sql, sqlparams, function(dberr, UserID){
						if(!dberr){
							callback(CSDNID);
						}
						else {
							callbackerr(dberr);
						}
					});
				}
			}
			else {
				//update
				var sql = '';
				var sqlparams = {}
				for(var info in params){
                                        for(var i=0;i<items.length;i++){
                                                if(items[i].toLocaleLowerCase() === info.toLocaleLowerCase()){
							if(sql==''){
								sql = 'UPDATE userjobinfo set '
							}
							else {
								sql += ',';
							}
							sql += items[i] + '=@' + items[i];
							sqlparams[items[i]] = params[info];
						}
					}
				}
				if(sql===''){
					callback(-1);
				}
				else {
					sql += ',LastUpdateDate=@LastUpdateDate WHERE CSDNID=@CSDNID'
					sqlparams['CSDNID'] = CSDNID;
					sqlparams['LastUpdateDate'] = time.now();
					sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
						if(dberr){
							callbackerr(dberr);
						}
						else {
							if(Count>0){
								callback(CSDNID);
							}
						}
					});
				}
			}
		}
	});
	
}

exports.GetbyIDModule = getbycsdnid;
exports.SavebyIDModule = savebycsdnid;
