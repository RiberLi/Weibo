/**
 * Created by zp on 13-12-5.
 */
var RedisClent = require('../Utility/Redis')();
var strHelper = require('../Utility/StringHelper')();

module.exports.autoroute = {
    post: {
        '/userdetail/savedetailbycsdnid' : savedetailbycsdnid  //通过csdnid保存联系方式单值
        ,'/userdetail/savedetailbyusername' : savedetailbycsdnid
        ,'/userdetail/getbycsdnid' : getbycsdnid  //通过csdnid获取联系方式
        ,'/userdetail/getbycsdnusername' : getbycsdnid
        ,'/userdetail/savecontactbycsdnid' : savecontactbycsdnid
        ,'/userdetail/savecontactbyusername' : savecontactbycsdnid

    }
};

//通过csdnid保存联系方式单值
function savedetailbycsdnid(req,res){
    var CSDNID = req.body.csdnid;
    var MainMobile = req.body.mainmobile;
    var SubMobile = req.body.submobile;
    var PubEmail = req.body.pubemail;
    var NotifyEmail = req.body.notifyemail;
    var UserName = req.body.username;
    var params = {};
    if(req.body.appname){
        params.appname = req.body.appname;
    }
    if(req.body.username){
        params.username = req.body.username;
    }

    if(!CSDNID){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else{
        require('../UCBussiness/savebycsdnid').Savedetailbycsdnid(CSDNID,MainMobile,SubMobile,PubEmail,NotifyEmail, params, function(dberr){
            res.send('{"err":99, "msg":"' + dberr + '"}');
        }, function(ID){
            if(ID>0){
                res.send('{"err":0, "msg": "ok"}');
                require('../UCBussiness/UpdateUserInfoTime')(CSDNID,UserName);//修改userinfo表更改时间
		//判断发送消息
		require('./userinfo').sendnotify(CSDNID,UserName,function(err,data){

		});
            }
            else if(ID==0){
                res.send('{"err":0, "msg": "ok"}');
		require('../UCBussiness/UpdateUserInfoTime')(CSDNID,UserName);//修改userinfo表更改时间
                //判断发送消息
                require('./userinfo').sendnotify(CSDNID,UserName,function(err,data){

                });
            }
            else{
                res.send('{"err":99, "msg": "没找到用户"}');
            }
        });
    }
}

//通过csdnid获取联系方式
function getbycsdnid(req,res){
    var CSDNID = req.body.csdnid;
    if(!CSDNID){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else{
        getUserCenterDetailByCSDNID(CSDNID,req,res);
    }
}

//用户联系方式byCSDNID
function getUserCenterDetailByCSDNID(CSDNID, req, res){
    RedisClent.get('userinfo_' + CSDNID.toString(),function(err, replystr){
        if(err){
            res.send('{"err":99,"msg":"' + err + '"}');
        }
        else{
            var reply = JSON.parse(replystr);
            if(reply){
                if(JSON.stringify(reply)==='{}'){
                    res.send('{"err":0,"msg":"ok","result": {}');
                }
                else{
                        getContact(CSDNID, reply, res);
                }
            }
            else{
                require('../UCBussiness/userinfo').GetUserInfoByCSDNID(CSDNID.toString()
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
                                getContact(CSDNID, data, res);
                        }
                    });
            }
        }
    });
}

//联系信息
function getContact(CSDNID, datalist, res){
    RedisClent.get('usercontact_' + CSDNID.toString(), function(err, reply){
        if(err){
            res.send('{"err":99,"msg":"' + err + '"}');
        }
        else{
            if(reply){
                combineInfo(CSDNID, datalist, reply, res);
            }
            else{
                require('../UCBussiness/userinfo').GetUserContactByCSDNID(CSDNID
                    ,function(cerr){
                        res.send('{"err":99,"msg":"' + cerr + '"}');
                    }
                    ,function(ContactList){
                        RedisClent.set('usercontact_' + CSDNID.toString(), JSON.stringify(ContactList));
                        combineInfo(CSDNID, datalist, JSON.stringify(ContactList), res);
                    }
                );
            }
        }
    });
}

//合并联系信息
function combineInfo(CSDNID, datalist, ContactListstr, res){
    var jsonContact = [];
    if(ContactListstr.length>0){
        var ContactList = JSON.parse(ContactListstr);
        for(var c=0 ; c<ContactList.length ; c++){
            jsonContact.push({contactid:ContactList[c].ContactID,value:strHelper.ConvertStr(ContactList[c].ContactValue),type:ContactList[c].ContactType});
        }
    }
    var jsonUserDetail = {err:0,msg:"ok",result:
        {
            csdnid:CSDNID
            ,mainmobile:strHelper.ConvertStr(datalist.MainMobile)
            ,submobile:strHelper.ConvertStr(datalist.SubMobile)
            ,loginemail:strHelper.ConvertStr(datalist.LoginEmail)
            ,pubemail:strHelper.ConvertStr(datalist.PubEmail)
            ,notifyemail:strHelper.ConvertStr(datalist.NotifyEmail)
            ,contactinfo:jsonContact
        }
    };

    res.send(JSON.stringify(jsonUserDetail));
}

function setSaveContactByCsdnid(req){
    var  ContactList = {};
    if(req.body.contactinfo){
        ContactList.contactinfo = req.body.contactinfo;
    }
    if(req.body.clientip){
        ContactList.clientip = req.body.clientip;
    }
    if(req.body.appname){
        ContactList.appname = req.body.appname;
    }
    return ContactList;
}

function savecontactbycsdnid(req,res){
    var CSDNID = req.body.csdnid;
    var username = req.body.username;
    var contactinfo =JSON.stringify(req.body.contactinfo);
    if(!CSDNID){
        res.send('{"err":99, "msg":"缺少csdnid参数"}');
    }
    else if(!contactinfo){
        res.send('{"err":99, "msg":"缺少contactinfo参数"}');
    }
    else{
        require('../UCBussiness/savebycsdnid').Savecontactbycsdnid(setSaveContactByCsdnid(req), username, CSDNID
            , function(info){
                res.send('{"err":0,"msg":"ok","result":{"contactinfo":' + JSON.stringify(info) + '}}');
                //联系方式缓存
            	require('../UCBussiness/userinfo').GetUserContactByCSDNID(CSDNID
                	, function(contact){
                    	//callbackerr('联系方式缓存记录失败');
                	}
                	, function(contactRedis){
                       	RedisClent.set('usercontact_' + CSDNID.toString(), JSON.stringify(contactRedis));
                    }
                );
            	require('../UCBussiness/UpdateUserInfoTime')(CSDNID,username);//修改userinfo表更改时间
		//判断发送消息
                require('./userinfo').sendnotify(CSDNID,username,function(err,data){

                });
        	}
        );
    }
}

