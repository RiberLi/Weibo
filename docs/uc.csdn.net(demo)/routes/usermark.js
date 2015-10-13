/**
 * Created by zp on 13-12-19.
 */
var RedisClent = require('../Utility/Redis')();
var strHelper = require('../Utility/StringHelper')();
var paramHelper = require('../Utility/checkparam')();
var ConTime = require('../Utility/time')();

module.exports.autoroute = {
    post: {
        '/UserMark/getbycsdnid' : getbycsdnid  //通过csdnid获取用户标记
        ,'/UserMark/getbyusername' : getbycsdnid
        ,'/UserMark/savebycsdnid' : savebycsdnid  //通过csdnid保存用户标记
        ,'/UserMark/savebyusername' : savebycsdnid
        ,'/UserMark/delbycsdnid' : delbycsdnid //删除用户标记
        ,'/UserMark/delbyusername' : delbycsdnid
    }
};
//获取用户标记
function getbycsdnid(req,res){
    var CSDNID = req.body.csdnid;
    var marktype = req.body.marktype;
    if(!CSDNID){
        res.send('{"err":101,"msg":"缺少csdnid参数"}');
    }
    else{
        var cb = function(err,data){
                if(err){
                    res.send(JSON.stringify({err:99,msg:err}));
                }
                else{
                    if(data){
                        var jsonUserMark = [];
			var flag = false;
                            for(var i=0 ; i < data.length ; i++){
                                if(data[i].Status == require('../appconfig').businessStauts.normal){
                                    if(!marktype ||  marktype == strHelper.ConvertInt(data[i].MarkType)){
					if(jsonUserMark.length === 0){
                                        	jsonUserMark.push({
                                            		csdnid : data[i].UserCSDNID
                                            		,markid : strHelper.ConvertInt(data[i].MarkID)
                                            		,markname : strHelper.ConvertInt(data[i].MarkName)
                                            		,marktype : strHelper.ConvertInt(data[i].MarkType)
                                            		,markurl : strHelper.ConvertStr(data[i].MarkUrl)
                                            		,status : strHelper.ConvertInt(data[i].Status)
                                            		,markdate : ConTime.jsDayToStr(data[i].MarkDate)
                                        	});
					}
					else {
						for(var k in jsonUserMark){
							var s = jsonUserMark[k];
							if(s.marktype === data[i].MarkType){
								flag = true;
								break;
							}
							else {
								flag = false;
							}
						}
						if(flag === false){
							jsonUserMark.push({
                                                        	csdnid : data[i].UserCSDNID
                                                        	,markid : strHelper.ConvertInt(data[i].MarkID)
                                                        	,markname : strHelper.ConvertInt(data[i].MarkName)
                                                        	,marktype : strHelper.ConvertInt(data[i].MarkType)
                                                        	,markurl : strHelper.ConvertStr(data[i].MarkUrl)
                                                        	,status : strHelper.ConvertInt(data[i].Status)
                                                        	,markdate : ConTime.jsDayToStr(data[i].MarkDate)
                                                	});
						}	
					}
                                    }
                                }
                            }
                        res.send(JSON.stringify({err:0,msg:"ok",result:jsonUserMark}));
                    }
                    else{
                        res.send('{"err": 0, "msg": "ok", "result":[]}');
                    }
                }
            };

        getusermark(CSDNID,cb);
    }
}

//获取保存用户标记信息
function setMarkParams(req,res){
    var params = {};
    if(req.body.username){
        params.username = req.body.username;
    }
    if(req.body.markid>=0){
        params.markid = req.body.markid;
    }
    if(req.body.markname){
        params.markname = req.body.markname;
    }
    if(req.body.marktype || req.body.marktype==0){
        params.marktype = req.body.marktype;
    }
    if(req.body.markurl){
        params.markurl = req.body.markurl;
    }
    return params;
    /*var params = {};
    if(paramHelper.checkParams(paramHelper.getParams(req, 'username'))){
        params.username = paramHelper.getParams(req, 'username');
    }
    if(paramHelper.checkParams(paramHelper.getParams(req, 'markid'))){
        params.markid = paramHelper.getParams(req, 'markid');
    }
    if(paramHelper.checkParams(paramHelper.getParams(req, 'markname'))){
        params.markname = paramHelper.getParams(req, 'markname');
    }
    if(paramHelper.checkParams(paramHelper.getParams(req, 'marktype'))){
        params.marktype = paramHelper.getParams(req, 'marktype');
    }
    if(paramHelper.checkParams(paramHelper.getParams(req, 'markurl'))){
        params.markurl = paramHelper.getParams(req, 'markurl');
    }
    return params;*/
}

//保存用户标记信息
function savebycsdnid(req,res){
    var CSDNID = req.body.csdnid;
    var MarkID = req.body.markid;
    var MarkName = req.body.markname;
    var MarkType = req.body.marktype;
    var MarkUrl = req.body.markurl;
    var UserName = req.body.username;

    if(!CSDNID){
        res.send('{"err":101, "msg":"缺少csdnid参数"}');
    }
    else if(MarkID < 0){
        res.send('{"err":101, "msg":"markid参数不正确"}');
    }
    else if(!MarkName){
        res.send('{"err":101, "msg":"缺少markname参数"}');
    }
    else if(!MarkType){
        res.send('{"err":101, "msg":"缺少marktype参数"}');
    }
    else if(!MarkUrl){
        res.send('{"err":101, "msg":"缺少markurl参数"}');
    }

    else{
        require('../UCBussiness/savebycsdnid').Savebymark(CSDNID, setMarkParams(req)
            , function(err){
                res.send(JSON.stringify({err:99,msg:err}));
            }
            , function(ID){
                require('../UCBussiness/savebycsdnid').getUserMark(CSDNID, function(dberr){
                    //res.send('{err:99, msg:"' + dberr + '"}');
                }, function(datalist){
                    RedisClent.set('usermark_' + CSDNID.toString(), JSON.stringify(datalist));
                });
                res.send('{"err": 0, "msg": "ok", "result": {"markid":' + ID + '}}');
            }
        );
    }
}

function getusermark(CSDNID, callback){
    RedisClent.get('usermark_' + CSDNID.toString(),function(err, replystr){
        if(err){
            callback(err,null);
        }
        else{
            if(replystr){//从redis中取得数据 并返回
                var reply = JSON.parse(replystr);
                callback(null,reply);
            }
            else{
                require('../UCBussiness/savebycsdnid').getUserMark(CSDNID, function(dberr){
                        callback(dberr,null);
                    }
                    , function(data){
                        if(data){
                            RedisClent.set('usermark_' + CSDNID.toString(), JSON.stringify(data));
                            callback(null,data);
                        }
                        else{
                            callback(null,JSON.parse('[]'));
                        }
                    }
                );
            }
        }
    });
}

//删除
function delbycsdnid(req, res){
    //{csdnid:13435235, markid：1，marktype:"10"
    var CSDNID = req.body.csdnid;
    //var Status=req.body.status
    if(!paramHelper.checkParams(CSDNID)){
        res.send('{"err":101, "msg":"缺少csdnid参数"}');
    }
    else if(!paramHelper.checkParams(req.body.markid)){
        res.send('{"err":101, "msg":"缺少markid参数"}');
    }
    else if(!paramHelper.checkParams(req.body.marktype)){
        res.send('{"err":101, "msg":"缺少marktype参数"}');
    }
    else{
        var params = setMarkParams(req);
        getusermark(CSDNID
            ,function(err,data){
                if(err){
                    res.send(JSON.stringify({err:99,msg:err}));
                }
                else{
                    var flag = false;
                    for(var i=0 ; i<data.length ; i++){
                        if(data[i].MarkID==params.markid && data[i].MarkType == params.marktype
                            && data[i].Status==require('../appconfig').businessStauts.normal){
                            flag = true;
                            data[i].Status = require('../appconfig').businessStauts.delete;
                            break;
                        }
                    }
                    if(flag==false){
                        res.send('{"err":101, "msg":"该用户没有此数据"}')
                    }
                    else{
                        //逻辑删除
                        require('../UCBussiness/savebycsdnid').DeleteByCSDNID(CSDNID,params.markid
                            ,function(showerr,count){
                                if(showerr){
                                    res.send(JSON.stringify({err:99,msg:showerr}));
                                }
                                else{
                                    RedisClent.set('usermark_' + CSDNID.toString(), JSON.stringify(data));
                                    res.send('{"err":0,"msg":"ok"}');
                                }
                            }
                        );
                    }
                }
            }
        );
    }
}

exports.GetUserMark = getusermark;
