module.exports = function(UserName,InfoID,Note){
	if(UserName){
		var sql = "INSERT INTO deleteinfo (UserName,NoteID,Note,Time) VALUES (@UserName,@InfoID,@Note,@Time)";
		var time = require('../Utility/time')();
		var sqlparams = {'UserName':UserName,'InfoID':InfoID,'Note':Note,'Time':time.now()}
		var ConnConfig = require('../config').mysqlconn;
		var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
		sqlhelper.ExecuteInsert('uc', sql, sqlparams, function(dberr, ID){
			if(dberr){
				return;
			}
		});
	}
	else {
		return;
	}
}
