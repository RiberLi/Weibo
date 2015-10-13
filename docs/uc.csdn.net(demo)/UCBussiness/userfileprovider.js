/**
 * Created by zlj on 13-11-22.
 */
var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
var RedisClent = require('../Utility/Redis')();

/*
通过csdnid获取
*/
function GetByAttachId(attachid,callbackerr, callback){    
        var str = '';
        var sql = "SELECT * FROM userattach ";
        sql += " WHERE attachid=@attachid ";
    
        var params = {'attachid': attachid};
        sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
            if(dberr){//数据库异常
                callbackerr(dberr);
            }
            else{//正常取回数据 写入redis 并返回
                for(var i=0 ; i < data.length ; i++) {
                    str ='"filename":"'+data[i].Filename+'","fileurl":"'+data[i].FileUrl +'","attachtype":'+data[i].AttachType;
                }
                callback(str);
            }
        });
}  


/*
通过UserName获取
*/
function SaveByCsdnIDUrl(csdnid,filename,fileurl,attachtype,uploadip,username,callbackerr, callback) {
        
        var sql = "insert into  userattach(" +
            " CSDNID,UserName,fileurl,Filename,CreateDate,UploadFileID,UploadIP,AttachType,AttachData " +
            ")values(" +
            " @CSDNID,@UserName,@FileUrl,@Filename,NOW(),0,@UploadIP,@AttachType,@AttachData" +
            ") ";
    if (!uploadip) {
        uploadip = "";
    }
    
        var params = {'CSDNID': csdnid,'Filename':filename,'UserName':username,'FileUrl':fileurl,'UploadIP':uploadip,'AttachType':attachtype,'AttachData':'','Note':''};
        sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
            if(dberr){//数据库异常
                callbackerr(dberr);
            }
            else{//正常取回数据 并返回
                
                if (attachtype == 1) {
                    var AvatarAttachID = data.insertId;
                    sql = "update userinfo set AvatarAttachID=@AvatarAttachID,AvatarAttachUrl=@FileUrl where csdnid=@CSDNID ";

                    var params2 = { 'CSDNID': csdnid, 'Filename': filename, 'UserName': username, 'FileUrl': fileurl, 'UploadIP': uploadip, 'AttachType': attachtype, 'AttachData': '', 'Note': '', 'AvatarAttachID': AvatarAttachID };
                    sqlhelper.ExecuteDataTable("uc", sql, params2, function(dberr, data) {
                        if (dberr) { //数据库异常
                            callbackerr(dberr);
                        } else { //正常取回数据 并返回
                            RedisClent.set('userinfo_' + csdnid.toString(), "");//重置userinfo缓存
                            callback(AvatarAttachID);
                        }
                    });
                }
                else if (attachtype == 3) {
                    var AvatarAttachID = data.insertId;
                    sql = "update userinfo set QrcodeAttachID=@AvatarAttachID,QrcodeAttachUrl=@FileUrl where csdnid=@CSDNID ";

                    var params2 = { 'CSDNID': csdnid, 'Filename': filename, 'UserName': username, 'FileUrl': fileurl, 'UploadIP': uploadip, 'AttachType': attachtype, 'AttachData': '', 'Note': '', 'AvatarAttachID': AvatarAttachID };
                    sqlhelper.ExecuteDataTable("uc", sql, params2, function(dberr, data) {
                        if (dberr) { //数据库异常
                            callbackerr(dberr);
                        } else { //正常取回数据 并返回
                            RedisClent.set('userinfo_' + csdnid.toString(), "");//重置userinfo缓存
                            callback(AvatarAttachID);
                        }
                    });
                }
                else  {
                      
                      RedisClent.set('userinfo_' + csdnid.toString(), ""); //重置userinfo缓存
                      callback(data.insertId);
                }
            }
        });
}  

exports.GetByAttachIdModule = GetByAttachId;
exports.SaveByCsdnIDUrlModule = SaveByCsdnIDUrl;