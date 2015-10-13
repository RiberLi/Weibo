/**
 * Created by Liujunjie on 13-11-22.
 */

var RedisClent = require('../Utility/Redis')();
var strHelper = require('../Utility/StringHelper')();
var paramHelper = require('../Utility/checkparam')();

module.exports.autoroute = {
    post:{
         '/userskill/getbycsdnid' : getbyid//获取自己添加的技能
        , '/userskill/getbyusername': getbyid
	, '/userskill/getsysbycsdnid': getsysbyid //获取系统推荐技能
	, '/userskill/getsysbyusername': getsysbyid 
        , '/userskill/savebyskillid': savebyskillid//保存
        , '/userskill/savebyskilliduname': savebyskillid
        , '/userskill/saveendorserbyskillid': endorserbyid//点击赞
        , '/userskill/saveendorserbyskilliduname': endorserbyusername
        , '/userskill/delbycsdnid': delbycsdnid//删除用户自己添加技能
        , '/userskill/delbyusername': delbycsdnid
	, '/userskill/delsysbycsdnid': delsysbycsdnid//删除系统推荐技能
        , '/userskill/delsysbyusername': delsysbycsdnid
	, '/userskill/delcachebyusername': delcachebycsdnid //删除系统推荐技能缓存
    }
};

function delcachebycsdnid(req,res){
	var CSDNID = req.body.csdnid;
	if(!CSDNID){
		res.send('{"err":99, "msg":"缺少csdnid参数"}');
	}
	else {
		RedisClent.delete('usersysskill_' + CSDNID.toString());
		//RedisClent.set('userskill_' + CSDNID.toString(), "");
		res.send('{"err":0,"msg":"ok"}');	
	}
}

function getSysSkillByid(CSDNID,UserName,callback){
    RedisClent.get('usersysskill_' + CSDNID.toString(),function(err, replystr){
        if(err){
            callback(err,null);
        }
        else{
            if(replystr){//从redis中取得数据 并返回
                var reply = JSON.parse(replystr);
                callback(null,reply);
            }
            else{
                require('../UCBussiness/userskill').GetSysbyIDModule(CSDNID,UserName,
                     function(dberr){
                            callback(dberr,null);
                        }
                    ,function(datalist){
                        if(datalist.length>0){
                            RedisClent.set('usersysskill_' + CSDNID.toString(), JSON.stringify(datalist));
                        }
                        callback(null,datalist);
                });
            }
        }
    });
}

exports.GetSysSkillByid = getSysSkillByid;

function getsysbyid(req, res){
    var CSDNID = req.body.csdnid;
    var UserName = req.body.username;
    if(!CSDNID){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else{
        getSysSkillByid(CSDNID,UserName,
            function(err,datalist){
                if(err){
                    res.send('{"err":99, "msg":"' + err + '"}');
                }
                else{
                    var jsonUserSkill = [];
                    if(datalist.length>0){
                        var normal = require('../appconfig').businessStauts.normal;
                        for(var i=0 ; i < datalist.length ; i++){
                            if(datalist[i].Status == normal){
                                jsonUserSkill.push({
                                        skillid:datalist[i].SkillID
                                        ,skillname:strHelper.ConvertStr(datalist[i].SkillName)
                                        ,skilllevel:strHelper.ConvertInt(datalist[i].SkillLevel)
					,skilldegree:strHelper.ConvertInt(datalist[i].SkillDegree)
					,usedtime:strHelper.ConvertInt(datalist[i].UsedTime)
                                        ,fromBI:datalist[i].FromBI
                                    }
                                );
                            }
                        }
                    }
                    var jsonResult = {err:0,msg:"ok",result:jsonUserSkill};
                    res.send(JSON.stringify(jsonResult));
                }
            }
        );
    }
}

function getSkillByid(CSDNID,UserName,callback){
    RedisClent.get('userskill_' + CSDNID.toString(),function(err, replystr){
        if(err){
            callback(err,null);
        }
        else{
            if(replystr){//从redis中取得数据 并返回
                var reply = JSON.parse(replystr);
                callback(null,reply);
            }
            else{
                require('../UCBussiness/userskill').GetbyIDModule(CSDNID,UserName,
                     function(dberr){
                            callback(dberr,null);
                        }
                    ,function(datalist){
                        if(datalist.length>0){
                            RedisClent.set('userskill_' + CSDNID.toString(), JSON.stringify(datalist));
                        }
                        callback(null,datalist);
                });
            }
        }
    });
}

exports.GetSkillByid = getSkillByid;

function getbyid(req, res){
    var CSDNID = req.body.csdnid;
    var UserName = req.body.username;
    if(!CSDNID){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else{
        getSkillByid(CSDNID,UserName,
            function(err,datalist){
                if(err){
                    res.send('{"err":99, "msg":"' + err + '"}');
                }
                else{
                    var jsonUserSkill = [];
                    if(datalist.length>0){
                        var normal = require('../appconfig').businessStauts.normal;
                        for(var i=0 ; i < datalist.length ; i++){
                            if(datalist[i].Status == normal){
                                jsonUserSkill.push({
                                        skillid:datalist[i].SkillID
                                        ,skillname:strHelper.ConvertStr(datalist[i].SkillName)
                                        ,skilllevel:strHelper.ConvertInt(datalist[i].SkillLevel)
					,skilldegree:strHelper.ConvertInt(datalist[i].SkillDegree)
					,usedtime:strHelper.ConvertInt(datalist[i].UsedTime)
                                        ,endorsercsdnids:strHelper.ConvertStr(datalist[i].EndorserCSDNIDs)
                                        ,endorserusernames:strHelper.ConvertStr(datalist[i].EndorserUserNames)
					,fromBI:datalist[i].FromBI
                                    }
                                );
                            }
                        }
                    }
                    var jsonResult = {err:0,msg:"ok",result:jsonUserSkill};
                    res.send(JSON.stringify(jsonResult));
                }
            }
        );
    }
}

//获取保存技能信息参数
function setSkillParams(req){
    var params = {};
    if(req.body.skillid>=0){
        params.skillid = req.body.skillid;
    }
    if(req.body.skillname){
        params.skillname = req.body.skillname;
    }
    if(req.body.usedtime){
        params.usedtime = req.body.usedtime;
    }
    if(req.body.skilllevel || req.body.skilllevel==0){
        params.skilllevel = req.body.skilllevel;
    }
    if(req.body.fromBI>=0){
        params.frombi = req.body.fromBI;
    }
    if(req.body.skilldes){
        params.skilldes = req.body.skilldes;
    }
//    if(req.body.endorsercsdnids){
//        params.endorsercsdnids = req.body.endorsercsdnids;
//    }
//    if(req.body.endorserusernames){
//        params.endorserusernames = req.body.endorserusernames;
//    }
    if(req.body.username){
        params.username = req.body.username;
    }
    return params;
}

//保存技能信息
function savebyskillid(req, res){
    var CSDNID = req.body.csdnid;
    var username = req.body.username;
    if(!CSDNID){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else{
        require('../UCBussiness/userskill').SaveBySkillID(CSDNID, setSkillParams(req)
            , function(err){
                res.send('{"err":99,"msg":"' + err + '"}');
            }
            , function(ID){
                require('../UCBussiness/userskill').GetbyIDModule(CSDNID,username, function(dberr){
                    //res.send('{err:99, msg:"' + dberr + '"}');
                }, function(datalist){
                    RedisClent.set('userskill_' + CSDNID.toString(), JSON.stringify(datalist));
                });
		require('../UCBussiness/userskill').GetSysbyIDModule(CSDNID,username, function(dberr){
                    //res.send('{err:99, msg:"' + dberr + '"}');
                }, function(datalist){
                    RedisClent.set('usersysskill_' + CSDNID.toString(), JSON.stringify(datalist));
                });
                require('../UCBussiness/UpdateUserInfoTime')(CSDNID,username);//修改userinfo表更改时间
                res.send('{"err": 0, "msg": "ok", "result": {"skillid":' + ID + '}}');
		//判断发送消息
                require('./userinfo').sendnotify(CSDNID,username,function(err,data){

                });
            }
        );
     }
}

//赞
function endorserbyid(req, res){
    var CSDNID = req.body.csdnid;
    var username = req.body.username;
    var skillID = req.body.skillid;
    var EndorID = req.body.endorsercsdnid;
    if(!CSDNID){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else if(!skillID){
        res.send('{"err":99, "msg":"缺少skillid参数"}');
    }
    else if(!EndorID){
        res.send('{"err":99, "msg":"缺少endorsercsdnid参数"}');
    }
    else{
        //检查不能重复点赞
        getSkillByid(CSDNID,username
            ,function(skillerr,skilldatalist){
                var checkflag = false;
                if(!skillerr){
                    if(skilldatalist.length>0){
                        for(var s=0 ; s<skilldatalist.length ; s++){
                            if(skilldatalist[s].SkillID==skillID){
                                var endorlist = skilldatalist[s].EndorserCSDNIDs;
                                if(endorlist){
                                    var endorlistArr = endorlist.split(',');
                                    for(var endorid=0 ; endorid<endorlistArr.length ; endorid++){
                                        if(endorlistArr[endorid]==EndorID.toString()){
                                            checkflag = true;
                                            break;
                                        }
                                    }
                                }
                                if(checkflag==true){
                                    break;
                                }
                            }
                        }
                    }
                }
                if(checkflag == false){
                    require('../UCBussiness/userinfo').GetUserByCSDNID(EndorID
                        ,function(usererr,data){
                            if(usererr){
                                res.send('{"err":99,"msg":"' + usererr + '"}');
                            }
                            else{
                                if(data.UserName){
                                    require('../UCBussiness/userskill').Endorser(CSDNID,skillID,EndorID,data.UserName,function(err,Count){
                                            if(err){
                                                res.send('{"err":99, "msg":"'+err+'"}');
                                            }
                                            else{
                                                if(Count>0){
                                                    //更新skill缓存
                                                    RedisClent.get('userskill_' + CSDNID.toString(),function(err, skillreplystr){
                                                            if(!err){
                                                                var skillreply = JSON.parse(skillreplystr);
                                                                if(skillreply.length>0){
                                                                    for(var i=0 ; i<skillreply.length ; i++){
                                                                        if(skillreply[i].SkillID === skillID){
                                                                            skillreply[i].EndorserCSDNIDs += ',' + EndorID;
                                                                            skillreply[i].EndorserUserNames += ',' + data.UserName;
                                                                            break;
                                                                        }
                                                                    }
                                                                    RedisClent.set('userskill_' + CSDNID.toString(), JSON.stringify(skillreply));
                                                                }
                                                            }
                                                        }
                                                    );
                                                    res.send('{"err":0,"msg":"ok"}');
                                                }
                                                else{
                                                    res.send('{"err":99, "msg":"修改不成功"}');
                                                }
                                            }
                                        }
                                    );
                                }
                                else{
                                    res.send('{"err":99,"msg":"没有找到点击人信息"}');
                                }
                            }
                        }
                    );
                }
                else{
                    res.send('{"err":99,"msg":"此用户已经点过赞了"}');
                }
            }
        );

    }
}

function endorserbyusername(req, res){
    var CSDNID = req.body.csdnid;
    var username = req.body.csdnid;
    var skillID = req.body.skillid;
    var EndorUN = req.body.endorserusername;
    if(!CSDNID){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else if(!skillID){
        res.send('{"err":99, "msg":"缺少skillid参数"}');
    }
    else if(!EndorUN){
        res.send('{"err":99, "msg":"缺少endorserusername参数"}');
    }
    else{
        //检查不能重复点赞
        getSkillByid(CSDNID,username
            ,function(skillerr,skilldatalist){
                var checkflag = false;
                if(!skillerr){
                    if(skilldatalist.length>0){
                        for(var s=0 ; s<skilldatalist.length ; s++){
                            if(skilldatalist[s].SkillID.toString() != skillID.toString()){
                                continue;
                            }
                            var endorlist = skilldatalist[s].EndorserUserNames;
                            if(endorlist){
                                var endorlistArr = endorlist.split(',');
                                for(var endorid=0 ; endorid<endorlistArr.length ; endorid++){
                                    if(endorlistArr[endorid]==EndorUN.toString()){
                                        checkflag = true;
                                        break;
                                    }
                                }
                            }
                            if(checkflag==true){
                                break;
                            }
                        }
                    }
                }
                if(checkflag == false){
                    require('../UCBussiness/userinfo').GetCsdnIDbyUserName(EndorUN
                        , function(dberr){
                            res.send('{"err":99,"msg":"' + dberr + '"}');
                        }
                        , function(data){
                            if(JSON.stringify(data) === '{}'){
                                res.send('{"err":99,"msg":"没找到对应用户"}');
                            }
                            else{
                                require('../UCBussiness/userskill').Endorser(CSDNID,skillID,data.CSDNID,EndorUN,function(err,Count){
                                        if(err){
                                            res.send('{"err":99, "msg":"'+err+'"}');
                                        }
                                        else{
                                            if(Count>0){
                                                res.send('{"err":0,"msg":"ok"}');
                                                RedisClent.get('userskill_' + CSDNID.toString(),function(err, skillreplystr){
                                                        if(!err){
                                                            var skillreply = JSON.parse(skillreplystr);
                                                            if(skillreply.length>0){
                                                                for(var i=0 ; i<skillreply.length ; i++){
                                                                    if(skillreply[i].SkillID === skillID){
                                                                        skillreply[i].EndorserCSDNIDs += ',' + data.CSDNID;
                                                                        skillreply[i].EndorserUserNames += ',' + EndorUN;
                                                                        break;
                                                                    }
                                                                }
                                                                RedisClent.set('userskill_' + CSDNID.toString(), JSON.stringify(skillreply));
                                                            }
                                                        }
                                                    }
                                                );
                                            }
                                            else{
                                                res.send('{"err":99, "msg":"修改不成功"}');
                                            }
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
                else{
                    res.send('{"err":99,"msg":"此用户已经已经对该技能点过赞了"}');
                }
            }
        );

    }
}

function delbycsdnid(req, res){
    var CSDNID = req.body.csdnid;
    var username = req.body.username;
    var skillid = req.body.skillid;
    if(!paramHelper.checkParams(CSDNID)){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else if(!paramHelper.checkParams(skillid)){
        res.send('{"err":99, "msg":"缺少skillid参数"}');
    }
    else{
        //var params = setPriacyParams(req);
        getSkillByid(CSDNID,username
            ,function(err,data){
                if(err){
                    res.send('{"err":99, "msg":"'+err+'"}');
                }
                else{
                    var flag = false;
                    for(var i=0 ; i<data.length ; i++){
                        if(data[i].SkillID == skillid
                            && data[i].Status==require('../appconfig').businessStauts.normal){
                            flag = true;
                            data[i].Status = require('../appconfig').businessStauts.delete;
                            break;
                        }
                    }
                    if(flag==false){
                        res.send('{"err":99, "msg":"该用户没有此技能数据"}');
                    }
                    else{
                        //逻辑删除
                        require('../UCBussiness/userskill').DeleteByCSDNID(CSDNID,username,skillid
                            ,function(showerr,count){
                                if(showerr){
                                    res.send('{"err":99, "msg":"'+showerr+'"}');
                                }
                                else{
                                    RedisClent.set('userskill_' + CSDNID.toString(), JSON.stringify(data));
                                    res.send('{"err":0,"msg":"ok"}');
				    require('../UCBussiness/UpdateUserInfoTime')(CSDNID,username);//修改userinfo表更改时间
				    //判断发送消息
                		    require('./userinfo').sendnotify(CSDNID,username,function(err,data){

                		    });
                                }
                            }
                        );
                    }
                }
            }
        );
    }
}

function delsysbycsdnid(req, res){
    var CSDNID = req.body.csdnid;
    var username = req.body.username;
    var skillid = req.body.skillid;
    if(!paramHelper.checkParams(CSDNID)){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else if(!paramHelper.checkParams(skillid)){
        res.send('{"err":99, "msg":"缺少skillid参数"}');
    }
    else{
        //var params = setPriacyParams(req);
        getSysSkillByid(CSDNID,username
            ,function(err,data){
                if(err){
                    res.send('{"err":99, "msg":"'+err+'"}');
                }
                else{
                    var flag = false;
                    for(var i=0 ; i<data.length ; i++){
                        if(data[i].SkillID == skillid
                            && data[i].Status==require('../appconfig').businessStauts.normal){
                            flag = true;
                            data[i].Status = require('../appconfig').businessStauts.delete;
                            break;
                        }
                    }
                    if(flag==false){
                        res.send('{"err":99, "msg":"该用户没有此技能数据"}');
                    }
                    else{
                        //逻辑删除
                        require('../UCBussiness/userskill').DeleteByCSDNID(CSDNID,username,skillid
                            ,function(showerr,count){
                                if(showerr){
                                    res.send('{"err":99, "msg":"'+showerr+'"}');
                                }
                                else{
                                    RedisClent.set('usersysskill_' + CSDNID.toString(), JSON.stringify(data));
                                    res.send('{"err":0,"msg":"ok"}');
                                }
			});
		    }
		}
	});
   }
}
