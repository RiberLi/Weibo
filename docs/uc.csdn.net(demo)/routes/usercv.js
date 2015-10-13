/**
 * Created by zlj on 13-11-22.
 */
var RedisClent = require('../Utility/Redis')();

module.exports.autoroute = {
    post: {
//         '/usercv/getlatestbycsdnid' : getlatestbycsdnid    
//        , '/usercv/getlatestbyusername' : getlatestbyusername   
          '/usercv/getattachcvbycsdnid' : getattachcvbycsdnid 
         , '/usercv/getattachcvbyusername' : getattachcvbycsdnid 
        , '/usercv/saveattachcvbycsdnid' : saveattachcvbycsdnid    
        , '/usercv/saveattachcvbyusername' : saveattachcvbycsdnid   
	, '/usercv/deleteattachcvbycsdnid': delattachcvbycsdnid
	, '/usercv/deleteattachcvbyusername': delattachcvbycsdnid 
    }
};

function delattachcvbycsdnid(req,res){
    var csdnid = req.body.csdnid;
    var username = req.body.username;
    var attachtype = 4;
    var key='usercv_'+csdnid;
    if(!csdnid){
	res.send('{"err":98, "msg":"缺少csdnid参数"}');
    }
    else{
	require('../UCBussiness/usercvprovider').DelAttachCVByCSDNID(csdnid,attachtype,function(dberr){
           res.send('{"err":99, "msg":"' + dberr + '"}');
	},function(data){
		if(data===true){
			require('../UCBussiness/UpdateUserInfoTime')(csdnid,username);//修改userinfo表更改时间
			res.send('{"err":0, "msg": "ok"}')
			RedisClent.delete(key);
		}
		else {
			res.send('{"err":101, "msg": "未能删除成功"}')
		}
	});
     }
}

function getlatestbycsdnid(req, res){
    var csdnid = req.body.csdnid;
    var key='usercv_last'+csdnid;
    if(!csdnid){
        res.send('{"err":98, "msg":"缺少csdnid参数"}');
    }
    else{
        //先从redis中找数据
        RedisClent.get(key,function(err, reply){
        if(err){//redis异常
           /// res.send('{"err":0, "msg":"' + err + '"}');
        }
           
        if(reply){//从redis中取得数据 并返回
		console.log(reply)
            if(reply.length>0){
                res.send('{"err": 0, "msg": "ok", "result":' + reply + '}');
            }
            else{
                res.send('{"err": 0, "msg": "ok", "result":[]}');
            }

        }
        else{//从数据库中取得，并且存入redis
                require('../UCBussiness/usercvprovider').GetLatestByCsdnIdModule(csdnid, function(dberr){
                    res.send('{"err":99, "msg":"' + dberr + '"}');
                }, function(json){
                    RedisClent.set(key, json);
                    if(json){
                        res.send('{"err":0, "msg": "ok","result":' + json + '}');
                    }
                    else{
                        res.send('{"err":0, "msg": "ok","result":[]}');
                    }
                });               
        }
    });
    }
}

function getlatestbyusername(req, res){
    var username = req.body.username;
    var csdnid = req.body.csdnid;
    var key='usercv_last'+csdnid;
    if(!username){
        res.send('{"err":98, "msg":"缺少username参数"}');
    }
    else{
        //先从redis中找数据
        RedisClent.get(key,function(err, reply){
        if(err){//redis异常
           /// res.send('{"err":0, "msg":"' + err + '"}');
        }
           
        if(reply){//从redis中取得数据 并返回
            //res.send('{"err": 0, "msg": "ok", "result":{' + reply + '}}');
            if(reply.length>0){
                res.send('{"err": 0, "msg": "ok", "result":' + reply + '}');
            }
            else{
                res.send('{"err": 0, "msg": "ok", "result":[]}');
            }
        }
        else{//从数据库中取得，并且存入redis
                require('../UCBussiness/usercvprovider').GetLatestByCsdnIdModule(csdnid, function(dberr){
                    res.send('{"err":99, "msg":"' + dberr + '"}');
                }, function(json){
                    RedisClent.set(key, json);
                    if(json){
                        res.send('{"err":0, "msg": "ok","result":' + json + '}');
                    }
                    else{
                        res.send('{"err":0, "msg": "ok","result":[]}');
                    }
                });               
        }
    });
    }
}

function getattachcvbycsdnid(req, res){
    var csdnid = req.body.csdnid;
    var key='usercv_'+csdnid;
    if(!csdnid){
        res.send('{"err":98, "msg":"缺少csdnid参数"}');
    }
    else{
        //先从redis中找数据
        RedisClent.get(key,function(err, reply){
        if(err){//redis异常
           // res.send('{"err":0, "msg":"' + err + '"}');
        }
        if(reply){//从redis中取得数据 并返回
            //res.send('{"err":0, "msg": "ok", "result:' + reply + '}');
            if(reply.length>0){
                res.send('{"err": 0, "msg": "ok", "result":' + reply + '}');
            }
            else{
                res.send('{"err": 0, "msg": "ok", "result":[]}');
            }
        }
        else{//从数据库中取得，并且存入redis
                require('../UCBussiness/usercvprovider').GetAttachcvByCsdnIdModule(csdnid, function(dberr){
                    res.send('{"err":99, "msg":"' + dberr + '"}');
                }, function(json){
                    RedisClent.set(key, json);
                    //res.send('{"err":0, "msg": "ok","result":' + json + '}');
                    if(json){
                        res.send('{"err":0, "msg": "ok","result":' + json + '}');
                    }
                    else{
                        res.send('{"err":0, "msg": "ok","result":[]}');
                    }
                });               
        }
    });
    }
}
/**
function getattachcvbyusername(req, res){
    var username = req.body.username;
     var csdnid = req.body.csdnid;
    var key='usercv_'+csdnid;
    if(!username){
        res.send('{"err":98, "msg":"缺少username参数"}');
    }
    else{
        //先从redis中找数据
        RedisClent.get(key,function(err, reply){
        if(err){//redis异常
           // res.send('{"err":0, "msg":"' + err + '"}');
        }
        if(reply){//从redis中取得数据 并返回
            //res.send('{"err":0, "msg": "ok", "result":{"csdnid":'+csdnid+'，"cvdata":"' + reply + '"}}');
            //res.send('{"err":0, "msg": "ok","result":' + reply + '}');
            if(reply.length>0){
                res.send('{"err": 0, "msg": "ok", "result":' + reply + '}');
            }
            else{
                res.send('{"err": 0, "msg": "ok", "result":[]}');
            }
        }
        else{//从数据库中取得，并且存入redis
                require('../UCBussiness/usercvprovider').GetAttachcvByCsdnIdModule(csdnid, function(dberr){
                    res.send('{"err":99, "msg":"' + dberr + '"}');
                }, function(json){
                    RedisClent.set(key, json);
                    //res.send('{"err":0, "msg": "ok","result":' + json + '}');
                    if(json){
                        res.send('{"err":0, "msg": "ok","result":' + json + '}');
                    }
                    else{
                        res.send('{"err":0, "msg": "ok","result":[]}');
                    }
                });               
        }
    });
    }
}
**/
function saveattachcvbycsdnid(req, res){
    var csdnid = req.body.csdnid;
    var filename = req.body.filename;
    var fileurl = req.body.fileurl;
    var attachtype = 4;
    var username = req.body.username;
     var key='usercv_'+csdnid;
    if(!csdnid){
        res.send('{"err":98, "msg":"缺少csdnid参数"}');
    }
    else if (!filename) {
          res.send('{"err":98, "msg":"缺少filename参数"}');
    }
    else if (!fileurl) {
          res.send('{"err":98, "msg":"缺少fileurl参数"}');
    }
    else {
        require('../UCBussiness/usercvprovider').SaveAttachCVByCsdnIdModule(csdnid,username,filename,fileurl,attachtype,function(dberr){
            res.send('{"err":99, "msg":"' + dberr + '"}');
        }, function(json){
            RedisClent.set(key, "");
	    require('../UCBussiness/UpdateUserInfoTime')(csdnid,username);//修改userinfo表更改时间
            res.send('{"err":0, "msg": "ok","result": {"attachid":'+json+'}}');
        });
    }
}
/**
function saveattachcvbyusername(req, res){
    var csdnid = req.body.csdnid;
    var filename = req.body.filename;
    var fileurl = req.body.fileurl;
    var attachtype = 4;
    var username = req.body.username;
     var key='usercv_'+csdnid;
      var key2='usercv_last'+csdnid;
    if(!csdnid){
        res.send('{"err":98, "msg":"缺少csdnid参数"}');
    }
    else if (!filename) {
          res.send('{"err":98, "msg":"缺少filename参数"}');
    }
    else if (!fileurl) {
          res.send('{"err":98, "msg":"缺少fileurl参数"}');
    }
    else if (!username) {
           res.send('{"err":98, "msg":"缺少username参数"}');
    }
    else {
        require('../UCBussiness/usercvprovider').SaveAttachCVByCsdnIdModule(csdnid,username,filename,fileurl,attachtype,function(dberr){
            res.send('{"err":99, "msg":"' + dberr + '"}');
        }, function(json){
            RedisClent.set(key, "");
            RedisClent.set(key2, "");
            res.send('{"err":0, "msg": "ok"}');
        });
    }
}
**/
