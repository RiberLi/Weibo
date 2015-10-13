/**
 * Created by zlj on 13-11-22.
 */
var RedisClent = require('../Utility/Redis')();
var paramHelper = require('../Utility/checkparam')();

module.exports.autoroute = {
    post: {
        '/usercert/getbycsdnidcerttype' : getbycsdnidcerttype    
        , '/usercert/getbyusernamecerttype' : getbycsdnidcerttype    
        , '/usercert/getbycsdnid' : getbycsdnid    
        , '/usercert/getbyusername' : getbyusername    
        , '/usercert/savebycsdnid' : savebycsdnid    
        , '/usercert/savebyusername' : savebyusername    
   	, '/usercert/savecertflagbyusername' : saveflagbyusername //管理员修改
   }
};

/*
 http://uc.csdn.net/usercert/getbycsdnidcerttype
 req: {}
 success res: {succ:1,msg:"ok"}
 error res: {succ:0,msg:"xxx err"}
 */

function saveflagbyusername(req,res){

	var params = {};
	if(paramHelper.checkParams(req.body.certflag)){
     		params.certflag = paramHelper.getParams(req, 'certflag');
    	}
	params.username = req.body.username;
	params.certtype = req.body.certtype;
	var CSDNID = req.body.csdnid;
	var CertType = req.body.certtype;
	if(!CSDNID){
        	res.send('{"err":99, "msg":"缺少csdnid/username参数"}');
    	}
	else if(!CertType){
        	res.send('{"err":99, "msg":"缺少certtype参数"}');
    	}
	else{
        	require('../UCBussiness/usercertprovider').SaveCertFlag(CSDNID, params
                	 , function(err){
                       	 	res.send('{"err":99,"msg":"' + err + '"}');
                	},function(data){
        			RedisClent.set('usercert_' + CSDNID.toString(), "");
                        	RedisClent.set('usercert_'+ CSDNID.toString()+"certtype"+CertType, "");                	
                         	res.send('{"err": 0,"msg": "ok"}');
                	});

    	}
	
}


function getbycsdnidcerttype(req, res){
    var csdnid = req.body.csdnid;
    var certtype = req.body.certtype;
   
    var key='usercert_'+csdnid+"certtype"+certtype;
    if(!csdnid){
        res.send('{"err":98, "msg":"缺少csdnid参数"}');
    }
    else if(!certtype)
    {
        res.send('{"err":98, "msg":"缺少certtype参数"}');
    }
    else{
        //先从redis中找数据
        RedisClent.get(key,function(err, reply){
        if(err){//redis异常
            res.send('{"err":97, "msg":"' + err + '"}');
        }
       
        if(reply){//从redis中取得数据 并返回
            res.send('{"err": 0, "msg": "ok",  "result":' + reply + '}');
        }
        else{//从数据库中取得，并且存入redis
                require('../UCBussiness/usercertprovider').GetByCsdnidCertTypeModule(csdnid,certtype, function(dberr){
                    res.send('{"err":0, "msg":"' + dberr + '"}');
                }, function(json){
                    RedisClent.set(key, json);
                    res.send('{"err": 0, "msg": "ok", "result":' + json + '}');
                });               
        }
    });
    }
}

function getbycsdnid(req, res){
    var csdnid = req.body.csdnid;
    var key='usercert_'+csdnid;
    if(!csdnid){
        res.send('{"err":98, "msg":"缺少csdnid参数"}');
    }
    else{
        //先从redis中找数据
        RedisClent.get(key,function(err, reply){
        if(err){//redis异常
            res.send('{"err":0, "msg":"' + err + '"}');
        }
        else{
            if(reply){//从redis中取得数据 并返回
                res.send('{"err": 0, "msg": "ok", "result": ' + reply + '}');
            }
            else{//从数据库中取得，并且存入redis
                 require('../UCBussiness/usercertprovider').GetByCSDNIDModule(csdnid, function(dberr){
                        res.send('{"err":99, "msg":"' + dberr + '"}');
                    }, function(json){
                        RedisClent.set(key, json);
                        res.send('{"err": 0, "msg": "ok","result": ' + json + '}');
                    });               
            }
        }
    });
    }
}

function getbyusername(req, res){
    var csdnid = req.body.csdnid;
    var username = req.body.username;
    var key='usercert_'+csdnid;
    if(!username){
        res.send('{"err":98, "msg":"缺少username参数"}');
    }
    else{
        //先从redis中找数据
        RedisClent.get(key,function(err, reply){
        if(err){//redis异常
            res.send('{"err":0, "msg":"' + err + '"}');
        }
        else{
            if(reply){//从redis中取得数据 并返回
                res.send('{"err": 0, "msg": "ok", "result": ' + reply + '}');
            }
            else{//从数据库中取得，并且存入redis
                 require('../UCBussiness/usercertprovider').GetByCSDNIDModule(csdnid, function(dberr){
                        res.send('{"err":99, "msg":"' + dberr + '"}');
                    }, function(json){
                        RedisClent.set(key, json);
                        res.send('{"err": 0, "msg": "ok","result": ' + json + '}');
                    });               
            }
        }
    });
    }
}

function savebycsdnid(req, res){
    var csdnid = req.body.csdnid;
    var usercert =JSON.stringify(req.body.usercert); 
    var username = req.body.username;
    var clientip = req.body.clientip;
    if (!clientip) {
        clientip = "";
    }
    if(!csdnid){
        res.send('{"err":98, "msg":"缺少csdnid参数"}');
    }
    else if (!usercert) {
        res.send('{"err":98, "msg":"缺少usercert参数"}');
    }
    else {
         require('../UCBussiness/usercertprovider').SaveByCSDNIDModeule(csdnid,usercert,username,clientip, function(dberr){
                        res.send('{err:99, msg:"' + dberr + '"}');
                    }, function(data){
			var certtype = data;
			RedisClent.set('usercert_' + csdnid.toString(), "");
			RedisClent.set('usercert_'+csdnid.toString()+"certtype"+certtype, "");
                        res.send('{"err": 0,"msg": "ok"}');
                    });      
    }
}

function savebyusername(req, res){
    var csdnid = req.body.csdnid;
    var usercert = req.body.usercert;
    var username = req.body.username;
    var clientip = req.body.clientip;
    if (!clientip) {
        clientip = "";
    }
    if(!username){
        res.send('{"err":98, "msg":"缺少username参数"}');
    }
    else if (!usercert) {
        res.send('{"err":98, "msg":"缺少usercert参数"}');
    }
    else {
         require('../UCBussiness/usercertprovider').SaveByCSDNIDModeule(csdnid,usercert,username,clientip, function(dberr){
                        res.send('{err:99, msg:"' + dberr + '"}');
                    }, function(data){
			var certtype = data;
			RedisClent.set('usercert_' + csdnid.toString(), "");
			RedisClent.set('usercert_'+csdnid.toString()+"certtype"+certtype, "");
                        res.send('{"err": 0,"msg": "ok"}');
                    });      
    }
}

