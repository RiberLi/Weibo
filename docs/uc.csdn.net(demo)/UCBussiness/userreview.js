var RedisClent = require('../Utility/Redis')();
var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);

function getbycsdnid(csdnid,callback){
    var key = 'userreview_' + csdnid.toString();
    RedisClent.hgetall(key, function(err, reply){
        if(err){
            callback(err);
        }
        else{
            if(reply){
                var data = {};
                for(var i in reply){
                  data[i] = parseInt(reply[i]);
                }
                callback(null,data);
            }
            else{
                var sql = "SELECT realname FROM userreview where csdnid = @csdnid";
                var params = {};  
                params.csdnid = csdnid;

                sqlhelper.ExecuteDataRow("uc", sql, params, function(dberr, data) {
                    if (dberr) {
                      callback(dberr);
                    }
                    else {
                        if(data){
                          RedisClent.hset(key,'realname',data['realname']);
                          callback(null,data);
                        }else{
                          callback(null,{});
                        }
                    }
                });

            }
        }

  });
}

function savebycsdnid(csdnid,realname,cb){
      var insertSql = "INSERT INTO userreview (csdnid,realname) VALUES (@csdnid,@realName);";
      var updateSql = "UPDATE userreview set realname = @realName where csdnid = @csdnid;"
      var params = {};
      params.csdnid = csdnid;
      params.realName = realname;

      var countSql = "Select Count(1) From userreview where csdnid = @csdnid";
      var countParams = {};
      countParams.csdnid = csdnid;

      function callback(err,data){
            if(err){
              cb(err);
            }else{
              var key = 'userreview_' + csdnid.toString();
              RedisClent.hset(key,'realname',realname);
              cb(err,data);
            }
      }
      sqlhelper.ExecuteScalar('uc', countSql, countParams, function(err, data){
        if(data > 0 ){
          sqlhelper.ExecuteNoQuery('uc', updateSql, params,callback);
        }else{
          sqlhelper.ExecuteInsert('uc', insertSql, params,callback);
        }
      });
}
exports.GetByCSDNID = getbycsdnid;
exports.SaveByCSDNID = savebycsdnid;
