/**
 * Created by zp on 13-11-25.
 */

var RedisClent = require('../Utility/Redis')();

/*var ConnConfig = require('../config').mysqlconn;
//console.log(ConnConfig);
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
*/
module.exports.autoroute = {
    post: {
        '/usertype/getbycsdnid' : getbyid //通过csdnid获取用户类型
        ,'/usertype/getbyusername' : getbyid
    }
};

//通过csdnid获取用户类型
function getbyid(req, res){
    var CsdnID = req.body.csdnid;
    if(!CsdnID){
        res.send('{"err":99, "msg":"缺少Csdnid参数"}');
    }
    else{
        RedisClent.get('userinfo_' + CsdnID.toString(),function(err, replystr){
            if(err){
                res.send('{"err":99, "msg":"' + err + '"}');
            }
            else{
                var reply = JSON.parse(replystr);
                if(reply){
                    if(JSON.stringify(reply)==='{}'){
                        res.send('{"err":0,"msg":"ok","result": {}');
                    }
                    else{
                        //console.log(JSON.stringify(reply));
                            res.send('{"err":0,"msg":"ok", "result": {'
                                + '"usertype":' + reply.UserType + '}}');
                    }
                    //res.send('{succ: 1, msg: "ok", usertype: ' + reply + '}');
                }
                else{
                    require('../UCBussiness/userinfo').GetUserInfoByCSDNID(CSDNID
                        , function(dberr){
                            res.send('{"err":99,"msg":"' + dberr + '"}');
                        }
                        , function(data){
                            if(data){
                                RedisClent.set('userinfo_' + CSDNID.toString(), JSON.stringify(data));
                            }
                            if(JSON.stringify(data)==='{}'){
                                res.send('{"err":0,"msg":"ok","result": {}');
                            }
                            else{
                                    res.send('{"err":0,"msg":"ok","result": {'
                                        + '"usertype":' + data.UserTypr + '}}');
                            }
                        });

                }
            }
        });
    }
}

