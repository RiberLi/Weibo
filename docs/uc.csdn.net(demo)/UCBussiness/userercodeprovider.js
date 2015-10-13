/**
 * Created by zlj on 13-11-22.
 */
var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
var RedisClent = require('../Utility/Redis')();

/*
通过csdnid获取
*/
function GetByCSDNID(csdnid,callbackerr, callback){    
        var str = '';
        var sql = "SELECT QrcodeAttachUrl FROM userinfo ";
        sql += " WHERE CSDNID=@CSDNID ";
    
        var params = {'CSDNID': csdnid};
        sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
            if(dberr){//数据库异常
                callbackerr(dberr);
            }
            else{//正常取回数据 写入redis 并返回
                for(var i=0 ; i < data.length ; i++) {
                    str = data[i].QrcodeAttachUrl;
                }
                if (!str) {
                    str = "";
                }
                callback(str);
            }
        });
}  

/*
通过CSDNID获取
*/
function SaveByCSDNID(csdnid,qrcodeattachurl,callbackerr, callback) {
        var sql = "update  userinfo set qrcodeattachurl=@qrcodeattachurl and LastUpdateDate=NOW() ";
        sql += "WHERE CSDNID=@csdnid ";
    
        var params = {'csdnid': csdnid,'qrcodeattachurl':qrcodeattachurl};
        sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
            if(dberr){//数据库异常
                callbackerr(dberr);
            }
            else{//正常取回数据 并返回
                 //重置userinfo缓存
                 RedisClent.set('userinfo_' + csdnid.toString(), "");
                 callback(true);
            }
        });
}

//刷新二维码
function refreshQR(userinfo, url, path, filename, callback){
    //用户名 - 职位- 工作单位 -联系邮箱 - 个人网站 字符串生成一个Qr文件
    if(userinfo){
        var value = userinfo.UserName;
/**
        if(userinfo.RealName){
            value += '(' + userinfo.RealName + ')';
        }
        if(userinfo.CurJob){
            value += '-' + userinfo.CurJob ;
        }
        if(userinfo.CurCompany){
            value += '-' + userinfo.CurCompany ;
        }
        if(userinfo.LoginEmail){
            value += '-' + userinfo.LoginEmail;
        }
**/
        require('./userinfo').GetUserContactByCSDNID(userinfo.CSDNID
            ,function(Contacterr){
                CreareQr(value, userinfo, url, path, filename, function(err, data){
                    if(err){
                        callback(err,null);
                    }
                    else{
                        callback(null,data);
                    }
                });
            }
            ,function(data){
                var ContactType = require('../appconfig').contacttype;
                for(var i=0 ; i<data.length ; i++){
                    if(data[i].ContactType == ContactType.homepage){
                        //value += '-' + data[i].ContactValue;
                        break;
                    }
                }
                CreareQr(value, userinfo, url, path, filename, function(err, data){
                    if(err){
                        callback(err,null);
                    }
                    else{
                        callback(null,data);
                    }
                });
            }
        );
    }
    else{
        callback('缺少用户信息','');
    }
}

function CreareQr(value, params, url, path, filename, callback){
    //生成qr
    var Qr = require('../Utility/qr')();
    Qr.GetQrToFile(value, path);
    //userattach表
    var insertSQL = 'INSERT INTO userattach'
        + '(CSDNID,UserName,FileViewName,Filename,FileUrl,CreateDate,AttachType,Note)'
        + 'VALUES (@CSDNID,@UserName,@FileViewName,@Filename,@FileUrl,NOW(),3,@Note);'
    var insertParams = {'FileUrl':url};
    insertParams.FileViewName = '二维码';
    insertParams.Filename = filename;
    insertParams.Note = value;
    insertParams.CSDNID = params.CSDNID;
    insertParams.UserName = params.UserName;
    sqlhelper.ExecuteInsert("uc", insertSQL, insertParams, function(dberr, insertID){
        if(dberr){
            callback(dberr,null);
        }
        else{
            //userinfo表
            var updateSQL = 'update userinfo set QrcodeAttachID=@QrcodeAttachID,QrcodeAttachUrl=@QrcodeAttachUrl'
                + ' where CSDNID=@CSDNID'
            var updateParams = {'CSDNID':params.CSDNID};
            updateParams.QrcodeAttachID = insertID;
            updateParams.QrcodeAttachUrl = url;
            sqlhelper.ExecuteNoQuery('uc', updateSQL, updateParams, function(dberr2, Count){
                    if(dberr2){
                        callback(dberr2,null);
                    }
                    else{
                        if(Count>0){
                            callback(null,updateParams);
                        }
                        else{
                            callback('没有同步userinfo',null);
                        }
                    }
                }
            );
        }
    });
}


exports.GetByCSDNIDModule = GetByCSDNID;
exports.SaveByCSDNIDModule = SaveByCSDNID;
exports.RefreshQr = refreshQR;
