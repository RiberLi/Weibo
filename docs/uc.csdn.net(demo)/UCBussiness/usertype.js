/**
 * Created by zp on 13-11-26.
 */
var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);

function getbyid(CsdnID, callbackerr, callback){
    var usertype = '';
    var sql = "SELECT * FROM userbaseinfo WHERE UserCSDNID=@csdnid";
    var params = {'csdnid': CsdnID};
    sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
        if(dberr){
           // res.send('{succ:0, msg:"' + dberr + '"}');
           callbackerr(dberr);     
        }
        else{
            if(data.length>0){
                usertype = data[0].UserType;
                RedisClent.set('usertype_getbyid_' + CsdnID.toString(),usertype);
                //res.send('{succ: 1, msg: "ok", usertype:' + usertype + ' }');
                callback(usertype);
            }
            else{
                //var insertsql = ''
                //sqlhelper.ExecuteInsert("uc", sql, params, function(dberr, data){

                //});
               //res.send('{succ: 0, msg: "未找到相应数据!"}');
                callbackerr('未找到相应数据!');
            }
        }
    });
}

exports.Getbyid = getbyid;