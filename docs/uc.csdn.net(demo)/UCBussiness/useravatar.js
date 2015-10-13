/**
 * Created by Liujunjie on 13-12-2.
 */
var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);

function getavatar(paramsArr, type, urltype, callbackerr, callback){
    var sql = '';
    if(type==='CSDNID'){
        sql = 'SELECT CSDNID,UserName FROM userinfo WHERE CSDNID IN ';
    }
    else if(type==='UserName'){
        sql = 'SELECT CSDNID,UserName FROM userinfo WHERE UserName IN ';
    }
    var params = {};
    for(var i=0 ; i<paramsArr.length ; i++){
        params['p' + i.toString()] = paramsArr[i];
        if(i==0){
            sql += '('
        }
        else{
            sql += ',';
        }
        sql += '@' + 'p' + i.toString();
    }
    sql += ')';

    sqlhelper.ExecuteDataTable("uc", sql, params,function(dberr, data){
        if(dberr){
            callbackerr(dberr);
        }
        else{
            if(data.length>0){
                for(var i=0;i<data.length;i++){
                    data[i]['qrcodeattachurl'] = getavatarbyusername(data[i]['UserName'],urltype);
                }
                callback(data);
            }
            else{
                callback(JSON.parse('[]'));
            }
        }
    });
}

//function get

function getavatarbyusername(username, type){
    var md5 = require('MD5');
    var lowerUserName = username.toLowerCase();
    var userMD5 = md5(lowerUserName);

    var avaurl = 'http://avatar.csdn.net/'
        +userMD5.substr(0,1).toUpperCase()+'/'+userMD5.substr(1,1).toUpperCase()+'/'+userMD5.substr(2,1).toUpperCase()
        +'/'+type+'_'+lowerUserName+'.jpg';
    return avaurl;
}

exports.GetAvatar = getavatar;
exports.GetAvatarByUsername = getavatarbyusername;