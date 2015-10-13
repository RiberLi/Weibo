/**
 * Created by Liujunjie on 13-11-21.
 */

var RedisClent = require('../Utility/Redis')();
var paramhelper = require('../Utility/checkparam')();
var logger = require('../Utility/logger.js');

module.exports.autoroute = {
    post: {
        '/codeclass/getclasslist' : getlist
	,'/codeclass/saveclasslist':savelistbyclassid
	,'/codeclass/deletelist':deletelistbyclassid
        ,'/codeitem/getlistbyclassid': getlistbyclassid
        ,'/codeitem/getitembycodeid': getbyclasscodeid
	,'/codeitem/saveitembycodeid':savebyclassidcodeid
	,'/codeitem/deleteitem':deletebyclassidcodeid
    }
};

function deletelistbyclassid(req,res){
	var params = {};
	if(paramhelper.checkParams(req.body.classid)){
		params.classid = paramhelper.getParams(req, 'classid');
	}
	var ClassID = params.classid;
	if(!ClassID){
		res.send('{"err":99, "msg":"缺少classid参数"}');
	}
	else{
		require('../UCBussiness/codeclass').DeleteList(params,
			function(err){
				 res.send('{"err":99,"msg":"' + err + '"}');
			}
			,function(data){
				 RedisClent.set('codeclass_', "");	
				 res.send('{"err": 0,"msg": "ok"}');				 
			}
		);	
	}

}

function deletebyclassidcodeid(req,res){

	var params = {};
        if(paramhelper.checkParams(req.body.classid)){
                params.classid = paramhelper.getParams(req, 'classid');
        }
	if(paramhelper.checkParams(req.body.codeid)){
                params.codeid = paramhelper.getParams(req, 'codeid');
        }
	var ClassID = params.classid;
	var CodeID = params.codeid;
	if(!ClassID){
                res.send('{"err":99, "msg":"缺少classid参数"}');
        }
	else if(!CodeID){
                res.send('{"err":99, "msg":"缺少codeid参数"}');
        }
	else{
                require('../UCBussiness/codeclass').DeleteItem(params,
                        function(err){
                                 res.send('{"err":99,"msg":"' + err + '"}');
                        }
                        ,function(data){
                                 RedisClent.set('codeitem_' + ClassID.toString(),"");
                                 RedisClent.set('codeitem_' + ClassID.toString() + '-' + CodeID.toString(), "");
                                 res.send('{"err": 0,"msg": "ok"}');
                        }
                );      
        }
}

function setCodeInfoParams(req){
	var params = {};

	if(paramhelper.checkParams(req.body.classid)){
		params.classid = paramhelper.getParams(req, 'classid');
	}
	if(paramhelper.checkParams(req.body.codeid)){
		params.codeid = paramhelper.getParams(req, 'codeid');
	}
	if(paramhelper.checkParams(req.body.codenamecn)){
		params.codenamecn = paramhelper.getParams(req, 'codenamecn');
	}
	if(paramhelper.checkParams(req.body.codenameen)){
                params.codenameen = paramhelper.getParams(req, 'codenameen');
        }
	if(paramhelper.checkParams(req.body.lvl)){
		params.lvl = paramhelper.getParams(req, 'lvl');
	}
	if(paramhelper.checkParams(req.body.parentid)){
		params.parentid = paramhelper.getParams(req, 'parentid');
	}
	if(paramhelper.checkParams(req.body.haschild)){
		params.haschild = paramhelper.getParams(req, 'haschild');
	}
	if(paramhelper.checkParams(req.body.option)){
		params.option = paramhelper.getParams(req, 'option');
	}
	return params;

}

function savebyclassidcodeid(req,res){

	var ClassID = paramhelper.getParams(req,'classid');
	var CodeID = paramhelper.getParams(req,'codeid');
	var Option = paramhelper.getParams(req,'option');
        if(!ClassID){
               res.send('{"err":99, "msg":"缺少classid参数"}');
        }
	else if(!CodeID){
	       res.send('{"err":99, "msg":"缺少codeid参数"}');
	}
	else if(!Option){
		res.send('{"err":99, "msg":"缺少option参数(option为1是修改,option为0是添加)"}');
	}
	else {
		var params = setCodeInfoParams(req);
		require('../UCBussiness/codeclass').SaveItem(params,
			function(err){
				res.send('{"err":99,"msg":"' + err + '"}');
			}
			,function(data){
				RedisClent.set('codeitem_' + ClassID.toString() + '-' + CodeID.toString(), "");
                RedisClent.set('codeitem_' + ClassID.toString(),"");
				res.send('{"err": 0,"msg": "ok"}');		
			}
		); 
	}

}

function setListInfoParams(req){

	var params ={};

	 if(paramhelper.checkParams(req.body.classid)){
		params.classid = paramhelper.getParams(req, 'classid');
	 }
	 if(paramhelper.checkParams(req.body.classnamecn)){
                params.classnamecn = paramhelper.getParams(req, 'classnamecn');
         }
	 if(paramhelper.checkParams(req.body.classnameen)){
                params.classnameen = paramhelper.getParams(req, 'classnameen');
         }

	 return params;
}

function savelistbyclassid(req,res){
	 
	 var ClassID = paramhelper.getParams(req,'classid');
	 if(ClassID < 0){
		res.send('{"err":99, "msg":"缺少classid参数"}');
	 }
	 else{
		var params = setListInfoParams(req);
	 	require('../UCBussiness/codeclass').SaveList(params,
			function(err){
				res.send('{"err":99,"msg":"' + err + '"}');
			}
			,function(ID){
				RedisClent.set('codeclass_', "");
				res.send('{"err":0,"msg":"ok", "result":{"classid": ' + ID + '}}');
			}
		);
	}
}


function getlist(req, res){
    //先从redis中找数据
    RedisClent.get('codeclass_',function(err, replystr){
        if(err){//redis异常
            res.send('{"err":99, "msg":"' + err + '"}');
        }
        else{
            var jsonList = [];
            var jsonResult = {};
            if(replystr){//从redis中取得数据 并返回
                var reply = JSON.parse(replystr);

                for(var i=0 ; i < reply.length ; i++){
                    jsonList.push({classid:reply[i].ClassID,classname:reply[i].ClassNameCn});
                }

                jsonResult = {err:0,msg:"ok",result:jsonList};
                res.send(JSON.stringify(jsonResult));
            }
            else{//从数据库中取得，并且存入redis
                require('../UCBussiness/codeclass').GetListModule(function(dberr){
                    res.send('{"err":99, "msg":"' + dberr + '"}');
                }, function(datalist){
                    if(datalist){
                        if(datalist.length>0){
                            RedisClent.set('codeclass_', JSON.stringify(datalist));
                            var list = '[';
                            for(var i=0 ; i < datalist.length ; i++){
                                jsonList.push({classid:datalist[i].ClassID,classname:datalist[i].ClassNameCn});
                            }
                            jsonResult = {err:0,msg:"ok",result:jsonList};
                            res.send(JSON.stringify(jsonResult));
                        }
                        else{
                            res.send('{"err": 0, "msg": "ok", "result":[]}');
                        }
                    }
                    else{
                        res.send('{"err": 0, "msg": "ok", "result":[]}');
                    }
                });
            }
        }
    });
}

function getlistbyclassid(req, res){
    var ClassID = paramhelper.getParams(req,'classid');
    if(!paramhelper.checkParams(ClassID)){
        res.send('{"err":99, "msg":"缺少classid参数"}');
    }
    else{
        RedisClent.get('codeitem_' + ClassID.toString(),function(err, replystr){
            if(err){
                res.send('{"err":99, "msg":"' + err + '"}');
            }
            else{
                var jsonList = [];
                var jsonResult = {};
                if(replystr){//从redis中取得数据 并返回
                    var reply = JSON.parse(replystr);
                    if(reply.length>0){
                        for(var i=0 ; i < reply.length ; i++){
                            jsonList.push({codeid:reply[i].CodeID
                                ,codenamecn:reply[i].CodeNameCn
                                ,parentid:reply[i].ParentID
                            });
                        }
                        jsonResult = {err:0,msg:"ok",result:jsonList};
                        res.send(JSON.stringify(jsonResult));
                    }
                    else{
                        res.send('{"err": 0, "msg": "ok", "result": []}');
                    }
                }
                else{
                    require('../UCBussiness/codeclass').GetListByClassIDModule(ClassID ,function(dberr){
                        res.send('{err:99, msg:"' + dberr + '"}');
                    }, function(datalist){
                        if(datalist.length>0){
                            RedisClent.set('codeitem_' + ClassID.toString(), JSON.stringify(datalist));
                            for(var i=0 ; i < datalist.length ; i++){
                                jsonList.push({codeid:datalist[i].CodeID,
                                    codenamecn:datalist[i].CodeNameCn
                                    ,parentid:datalist[i].ParentID
                                });
                            }
                            jsonResult = {err:0,msg:"ok",result:jsonList};
                            res.send(JSON.stringify(jsonResult));
                        }
                        else{
                            res.send('{"err": 0, "msg": "ok", "result": []}');
                        }
                    });

                }
            }
        });

    }

}

function getbyclasscodeid(req, res){
    //程序响应时间记录
    var time1 = new Date().getTime();
    var log = require('../Utility/noteuctime')();
    var url = '/codeitem/getitembycodeid';
    var ClassID = paramhelper.getParams(req,'classid');
    var CodeID = paramhelper.getParams(req,'codeid');
    if(!paramhelper.checkParams(ClassID)){
        res.send('{"err":99, "msg":"缺少classid参数"}');
    }
    else if(!paramhelper.checkParams(CodeID)){
        res.send('{"err":99, "msg":"缺少codeid参数"}');
    }
    else{
        var jsondata = {};
        var jsonResult = {};
        RedisClent.get('codeitem_' + ClassID.toString() + '-' + CodeID.toString(),function(err, replystr){
            if(err){
                res.send('{"err":99,"msg":"' + err + '"}');
            }
            else{
                if(replystr){
		    var time2 = new Date().getTime();
		    var time = parseInt(time2 - time1);
		    var comment = 'GetFromRedis';
                    var reply = JSON.parse(replystr);
                    jsondata = {codeid:reply.CodeID,codenamecn:reply.CodeNameCn};
                    jsonResult = {err:0,msg:"ok",result:jsondata};
                    res.send(JSON.stringify(jsonResult));
		    log.ucTimeLog(url,time,comment);
                }
                else{
                    require('../UCBussiness/codeclass').GetByClassCodeIDModule(ClassID, CodeID ,function(dberr){
                        res.send('{"err":99, "msg":"' + dberr + '"}');
                    }, function(data){
                        if(data){
                            RedisClent.set('codeitem_' + ClassID.toString() + '-' + CodeID.toString(), JSON.stringify(data));
                            jsondata = {codeid:data.CodeID,codenamecn:data.CodeNameCn};
                            jsonResult = {err:0,msg:"ok",result:jsondata};
                            res.send(JSON.stringify(jsonResult));
                        }
                        else{
                            res.send('{"err":0,"msg":"ok","result":{}}');
                        }
			var time2 = new Date().getTime();
			var time = parseInt(time2 - time1);
			var comment = 'GetFromMysql';
			log.ucTimeLog(url,time,comment);
                    });

                }
            }
        });
    }
}
