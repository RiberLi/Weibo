/**
 * Created by Liujunjie on 13-12-9.
 */
var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);

//获取隐私信息
function getbycsdnid(CSDNID, callbackerr, callback){
    var sql = "SELECT * FROM userprivacy WHERE UserCSDNID=@UserCSDNID ";
    var params = {'UserCSDNID': CSDNID};
    sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
        if(dberr){//数据库异常
            callbackerr(dberr);
        }
        else{//正常取回数据
            callback(data);
        }
    });
}

function savebycsdnid(CSDNID, params, callbackerr, callback){
    var items = [
        'AppName',
        'PrivacyName',
        'Status',
        'LastUpdateIP',
        'IsPublic'
    ];
    var sql = '';
    var sqlparams = {};
    var time = require('../Utility/time')();
    if(params.privacyid>0){
        //update
        for(var privacy in params){
            for(var i=0 ; i<items.length ; i++){
                if(items[i].toLocaleLowerCase() === privacy){
                    if(sql === ''){
                        sql = 'UPDATE userprivacy set '
                    }
                    else{
                        sql += ',';
                    }
                    sql += items[i] + '=@' + items[i];
                    sqlparams[items[i]] = params[privacy];
                }
            }
        }
        if(sql != ''){
            sql += ',LastUpdateDate=@LastUpdateDate WHERE PrivacyID=@PrivacyID and UserCSDNID=@UserCSDNID'
            sqlparams['UserCSDNID'] = CSDNID;
            sqlparams['PrivacyID'] = params.privacyid;
            sqlparams['LastUpdateDate'] = time.now();
            sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
                    if(dberr){
                        callbackerr(dberr);
                    }
                    else{
                        if(Count>0){
                            callback(params.privacyid);
                        }
                        else{
                            callbackerr('保存失败，影响行数为0');
                        }
                    }
                }
            );
        }
        else{
            callbackerr('参数不全');
        }
    }
    else if(params.privacyid==0){
        //insert
        var fields = '';
        var values = '';
        for(var privacy in params){
            for(var i=0 ; i<items.length ; i++){
                if(items[i].toLocaleLowerCase() === privacy){
                    if(sql === ''){
                        sql = 'INSERT INTO userprivacy '
                        fields = '(';
                        values = '(';
                    }
                    else{
                        fields += ',';
                        values += ',';
                    }
                    fields += items[i];
                    values += '@' + items[i]
                    sqlparams[items[i]] = params[privacy];
                }
            }
        }
        fields += ',UserCSDNID,UserName,LastUpdateDate,Status)';
        values += ',@UserCSDNID,@UserName,@LastUpdateDate,' + require('../appconfig').businessStauts.normal + ')';
        sqlparams['UserCSDNID'] = CSDNID;
        sqlparams['UserName'] = params.username;
        sqlparams['LastUpdateDate'] = time.now();
        sql += fields + ' VALUES ' + values;
        sqlhelper.ExecuteInsert('uc', sql, sqlparams, function(dberr, ID){
                if(dberr){
                    callbackerr(dberr);
                }
                else{
                    callback(ID);
                }
            }
        );
    }
    else{
        callbackerr('无效privacyid');
    }
}

function deletebycsdnid(CSDNID,privacyid,callback){
    var sql = 'UPDATE userprivacy set Status=@Status ,LastUpdateDate=NOW() where PrivacyID=@PrivacyID and UserCSDNID=@UserCSDNID'
    var sqlparams = {'PrivacyID':privacyid,'UserCSDNID':CSDNID,'Status':require('../appconfig').businessStauts.delete};
    sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
            if(dberr){
                callback(dberr,null);
            }
            else{
                if(Count>0){
                    callback(null, sqlparams.privacyid);
                }
                else{
                    callback('保存失败，影响行数为0', null);
                }
            }
        }
    );
}

exports.GetByCSDNID = getbycsdnid;
exports.SaveByCSDNID = savebycsdnid;
exports.DeleteByCSDNID = deletebycsdnid;