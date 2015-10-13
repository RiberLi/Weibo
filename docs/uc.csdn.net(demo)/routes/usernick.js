/**
 * Created by zlj on 13-11-22.
 */
var RedisClent = require('../Utility/Redis')();

var ConnConfig = require('../config').mysqlconn;
//console.log(ConnConfig);
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);

module.exports.autoroute = {
    post: {
        //'/usernick/getbyid' : getbyid
        '/usernick/savebycsdnid' : savebycsdnid
         ,'/usernick/savebyusername' : savebycsdnid
        //,'/usernick/getbycsdnids' : getbycsdnids
        ,'/usernick/getbyusernames' : getbyusernames
        ,'/usernick/checknickbycsdnid' : checknick
        ,'/usernick/checknickbyusername' : checknick
        ,'/usernick/checknick' : checknickname
    }
};

/*
 http://uc.csdn.net/usernick/getbycsdnids
 req: {}
 success res: {succ:1,msg:"ok",nickname:""]}
 error res: {succ:0,msg:"xxx err"}
 */

function getbycsdnids(req, res){
    var csdnids = req.body.csdnids;
    if(!csdnids){
        res.send('{"err":101, "msg":"缺少csdnids参数"}');
    }
    else {
        var csdnidsStr = JSON.stringify(csdnids).replace('[','').replace(']','');
        var sqlforuser = "SELECT csdnid,username,nickname FROM userinfo where CSDNID in(" + csdnidsStr + ')';
        sqlhelper.ExecuteDataTable("uc", sqlforuser, {}, function(dberr, data) {
            if (dberr) {
                res.send(JSON.stringify({err:99,msg:dberr}));
            }
            else {
                var jsonResult = {err:0,msg:"ok",result:data};
                //{err:0,msg:"ok",result:[{csdnid:13435235,nickname:"rocky"},{csdnid:13435235,nickname:"rocky"}]}
                res.send(JSON.stringify(jsonResult));
            }
        });
    }
}

/*
 http://uc.csdn.net/usernick/getbyusernames
 req: {}
 success res: {succ:1,msg:"ok",nickname:""]}
 error res: {succ:0,msg:"xxx err"}
 */

function getbyusernames2(req, res){
    var usernames = req.body.usernames;
     if(!usernames){
        res.send('{"err":101, "msg":"缺少usernames参数"}');
    }
    else {
        for (var i=0; i<usernames.length; i=i+1) {
             console.log(usernames[i]);
        }
         var usernamesStr = JSON.stringify(usernames).replace('[','').replace(']','');
         var sqlforuser = "SELECT csdnid,username,nickname FROM userinfo where username in(" + usernamesStr + ')';
         sqlhelper.ExecuteDataTable("uc", sqlforuser, {}, function(dberr, data) {
                if (dberr) {
                    res.send(JSON.stringify({err:99,msg:dberr}));
                }
                else {
                    var jsonResult = {err:0,msg:"ok",result:data};
                    //{err:0,msg:"ok",result:[{csdnid:13435235,nickname:"rocky"},{csdnid:13435235,nickname:"rocky"}]}
                    res.send(JSON.stringify(jsonResult));
                }
            });                 
    }
}

function getbyusernames(req, res){
    //程序响应时间记录
    var time1 = new Date().getTime();
    var url = '/usernick/getbyusernames';
    var log = require('../Utility/noteuctime')();
    var usernames = req.body.usernames;
     if(!usernames){
        res.send('{"err":101, "msg":"缺少usernames参数"}');
        return ;
    }
    var keys = new Array()
    for (var i=0; i<usernames.length; i=i+1) {
         keys[i] =  'uname_' + usernames[i].toLowerCase() ;
    }
    RedisClent.mget(keys, function(err, reply){
        if(err){
            res.send(JSON.stringify({err:98,msg:err}));
        }
        else{
           var unames = new Array();
           var jsonArr = new Array();
           for (var i=0; i<reply.length; i=i+1) {
              if(reply[i] == null){
                  unames.push(usernames[i]);
              }else{
                  jsonArr.push(JSON.parse(reply[i]))
              }
           }
           if(unames.length > 0){
             var usernamesStr = JSON.stringify(unames).replace('[','').replace(']','');
             var sqlforuser = "SELECT csdnid,username,nickname,userstatus FROM userinfo where username in(" + usernamesStr + ')';
             //console.log(sqlforuser);

             sqlhelper.ExecuteDataTable("uc", sqlforuser, {}, function(dberr, data) {
                    if (dberr) {
                        res.send(JSON.stringify({err:99,msg:dberr}));
                    }
                    else {
                        for(var i = 0;i<data.length;i++){
			    var userstatus = data[i]['userstatus'];
                            var username = data[i]['username'];
			    var csdnid = data[i]['csdnid'];
			    if(userstatus == 2 || userstatus == 4){
			    	var nickname = null;
			    }
			    else {
				var nickname = data[i]['nickname'];
			    }
			    var content={'csdnid':csdnid,'username':username,'nickname':nickname};
                            var v = JSON.stringify(content);
			    //console.log(data[i]);
                            RedisClent.set('uname_' + username.toLowerCase() , v);
                            jsonArr.push(content);
                        }
                       var jsonResult = {err:0,msg:"ok",result:jsonArr};
                       res.send(JSON.stringify(jsonResult));
		       var time2 = new Date().getTime();
                       var time = parseInt(time2 - time1);
		       var comment = 'GetFromMysql';
		       log.ucTimeLog(url,time,comment);
                    } 
                });                 

           }else{
               var jsonResult = {err:0,msg:"ok",result:jsonArr};
               res.send(JSON.stringify(jsonResult));
	       var time2 = new Date().getTime();
               var time = parseInt(time2 - time1);
               var comment = 'GetFromRedis';
               log.ucTimeLog(url,time,comment);
           }

        }
    
    });

}


/*
 http://uc.csdn.net/usernick/savebycsdnid
 req: {}
 success res: {succ:1,msg:"ok"}
 error res: {succ:0,msg:"xxx err"}
 */
function savebycsdnid(req, res){
	var csdnid = req.body.csdnid;
  var nickname=req.body.nickname;
  var username = req.body.username;
  var appname = req.body.appname;
  if(!csdnid){
  	res.send('{"err":98, "msg":"缺少csdnid参数"}');
  }
  else{
  	require('../UCBussiness/usernickprovider').SaveByCSDNIDModule(csdnid,nickname,username,appname, function(dberr){
    	res.send(JSON.stringify({err:99,msg:dberr}));
    }, function(json){                  
    	res.send('{"err": 0,"msg": "ok"}');
		 	require('../UCBussiness/UpdateUserInfoTime')(csdnid,username);//修改userinfo表更改时间
      //更新userinfo_csdnid缓存
			require('../UCBussiness/userinfo').Update_UserInfo_Redis(csdnid,function(err,userinfo){ });
      //nick_csdnid用于通过csdnid获取nickname，目前usernick/getbycsdnids接口无人使用，使用usernick/getbyusernames接口。
		 	//var key='nick_'+csdnid;
     	//RedisClent.set(key, nickname);
		 	//更新uname_username缓存
		 	RedisClent.delete('uname_' + username.toLowerCase());
		  require('../UCBussiness/userinfo').GetCsdnIDbyUserName(username,function(err){
		  
			},function(data){
		    
			});
		}); 
	}
}

function checknick(req, res) {
    var nickname = req.body.nickname;
    var CSDNID = req.body.csdnid;
    if(!CSDNID){
        res.send('{"err":98, "msg":"缺少csdnid参数"}');
    }
    else if (!nickname) {
        res.send('{"err":98, "msg":"缺少nickname参数"}');
    } else {
        require('../UCBussiness/usernickprovider').CheckNickModeule(nickname,CSDNID
        , function(err,count) {
                if(err){
                    res.send('{"err": 99, "msg": "'+err+'"}');
                }
                else{
                    if(count>0){
                        res.send('{"err": 0, "msg": "ok","result":{"result":false}}');
                    }
                    else{
                        res.send('{"err": 0, "msg": "ok","result":{"result":true}}');
                    }
                }
        });
    }
}
function checknickname(req,res){
    var nickname = req.body.nickname;
    if (!nickname) {
        res.send('{"err":98, "msg":"缺少nickname参数"}');
    } else {
        require('../UCBussiness/usernickprovider').CheckNickNameModeule(nickname
            , function(err,count) {
                if(err){
                    res.send('{"err": 99, "msg": "'+err+'"}');
                }
                else{
                    if(count>0){
                        res.send('{"err": 0, "msg": "ok","result":{"result":true}}');
                    }
                    else{
                        res.send('{"err": 0, "msg": "ok","result":{"result":false}}');
                    }
                }
            });
    }
}

