/**
 * Created by zlj on 13-11-22.
 */
var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
var ConTime = require('../Utility/time')();
/*
通过csdnid获取
*/
function GetLatestByCsdnId(csdnid,callbackerr, callback){    
        var str = '';
        var sql = "SELECT AttachData FROM userattach ";
        sql += " WHERE CSDNID=@CSDNID and attachtype=4 order by AttachID desc  LIMIT 0,1 ";
    
        var params = {'CSDNID': csdnid};
        sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
            if(dberr){//数据库异常
                callbackerr(dberr);
            }
            else{//正常取回数据 写入redis 并返回
                for(var i=0 ; i < data.length ; i++) {
                  str = data[i].AttachData;
                }
                callback(str);
            }
        });
} 

function GetLatestByUserName(csdnid,callbackerr, callback){    
        var str = '';
        var sql = "SELECT AttachData FROM userattach ";
        sql += " WHERE CSDNID=@CSDNID and attachtype=5 order by AttachID desc  LIMIT 0,1 ";
    
        var params = {'CSDNID': csdnid};
        sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
            if(dberr){//数据库异常
                callbackerr(dberr);
            }
            else{//正常取回数据 写入redis 并返回
                for(var i=0 ; i < data.length ; i++) {
                  str = data[i].AttachData;
                }
                callback(str);
            }
        });
} 

function GetAttachcvByCsdnId(csdnid,callbackerr, callback){    
        var str = '';
        var sql = "SELECT * FROM userattach ";
        sql += " WHERE CSDNID=@CSDNID and attachtype=4 and Status=1";
    
        var params = {'CSDNID': csdnid};
        sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
            if(dberr){//数据库异常
                callbackerr(dberr);
            }
            else{//正常取回数据 写入redis 并返回
		if(data.length>0){
                 str += "[";
		str += "{"
                var strAttach = "";
		if(data[0].LastUpdateDate){
                	strAttach += '"attachid":'+data[0].AttachID+',"filename":"'+ data[0].Filename +'","fileurl":"' + data[0].FileUrl + '","lastupdatedate":"'+ConTime.jsDateTimeToStr(data[0].LastUpdateDate)+'"';
		}
		else {
			strAttach += '"attachid":'+data[0].AttachID+',"filename":"'+ data[0].Filename +'","fileurl":"' + data[0].FileUrl + '","lastupdatedate":"'+ConTime.jsDateTimeToStr(data[0].CreateDate)+'"';
		}
               
                str +=strAttach+ "}";
                str +=']';
		}
		else {
			str += "[";
			str +=']';
		}
                callback(str);
            }
        });
} 

/*
添加或修改
*/
function SaveAttachCVByCsdnId(csdnid,username,filename,fileurl,attachtype,callbackerr, callback) {
	var sql = "SELECT AttachID FROM userattach where CSDNID=@CSDNID and AttachType=@AttachType and Status=1";
        var params = {'CSDNID':csdnid,'AttachType':attachtype};
        sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
		if(dberr){
			callbackerr(dberr);
		}
		else {
			if(data.length>0){
				var sql = "UPDATE userattach SET FileName=@FileName,FileUrl=@FileUrl,LastUpdateDate=@LastUpdateDate where AttachID=@AttachID";
				var params = {'FileName':filename,'FileUrl':fileurl,'LastUpdateDate':ConTime.now(),'AttachID':data[0].AttachID};
				console.log(sql,params);
				sqlhelper.ExecuteDataTable('uc', sql, params, function(dberr, res){
					if(dberr){
						callbackerr(dberr);
					}
					else{
						if(res){
							callback(data[0].AttachID);
						}
					}
				});
			}
			else {
				var sql = "insert into  userattach(" +
            				"CSDNID,UserName,Filename,FileUrl,CreateDate,AttachType" +
            				")values(@CSDNID,@UserName,@Filename,@FileUrl,@CreateDate,@AttachType)";
				var params={ 'CSDNID': csdnid,'UserName':username,'Filename': filename,'FileUrl':fileurl,'AttachType':attachtype,'CreateDate':ConTime.now()};
				console.log(sql,params)
				sqlhelper.ExecuteInsert('uc', sql, params, function(dberr, ID){
					if(dberr){
						callback(dberr);
					}
					else {
						callback(ID);
					}
				});
			}
		}
	});
}  

function DeleteAttachCVByCSDNID(CSDNID,AttachType,callbackerr,callback){
	var sql = "UPDATE userattach SET Status=0 WHERE CSDNID=@CSDNID and AttachType=@AttachType ";
	var params = {'CSDNID':CSDNID,'AttachType':AttachType};
	sqlhelper.ExecuteDataTable('uc', sql, params, function(dberr, res){
		if(dberr){
                	callbackerr(dberr);
                }
		else{
			if(res){
				callback(true);
			}
		}
	});
}

//exports.GetLatestByCsdnIdModule = GetLatestByCsdnId;
//exports.GetLatestByUserNameModule = GetLatestByUserName;
exports.GetAttachcvByCsdnIdModule = GetAttachcvByCsdnId;
exports.SaveAttachCVByCsdnIdModule = SaveAttachCVByCsdnId;
exports.DelAttachCVByCSDNID = DeleteAttachCVByCSDNID;
