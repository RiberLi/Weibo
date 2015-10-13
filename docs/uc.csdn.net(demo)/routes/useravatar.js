/**
 * Created by Liujunjie on 13-12-2.
 */

//var RedisClent = require('../Utility/Redis')();
var strHelper = require('../Utility/StringHelper')();

module.exports.autoroute = {
    post: {
        '/useravatar/getbycsdnids' : getbycsdnids   //用户头像
        ,'/useravatar/getbyusernames': getbyusernames //
    }
};

//csdnids:[13435235,13435236]
function getbycsdnids(req, res){
    var csdnids = req.body.csdnids;
    var avatartype = req.body.avatartype;
    if(!csdnids){
        res.send('{"err":99, "msg":"缺少csdnids参数"}');
    }
    else if(!(avatartype==0||avatartype==1||avatartype==2||avatartype==3)){
        res.send('{"err":99, "msg":"缺少avatartype参数"}');
    }
    else{
        GetAvatar(csdnids, 'CSDNID' ,avatartype, req, res);
    }
}

function getbyusernames(req, res){
    var usernames = req.body.usernames;
    var avatartype = req.body.avatartype;
    if(!usernames){
        res.send('{"err":99, "msg":"缺少usernames参数"}');
    }
    else if(!(avatartype==0||avatartype==1||avatartype==2||avatartype==3)){
        res.send('{"err":99, "msg":"缺少avatartype参数"}');
    }
    else{
        GetAvatar(usernames, 'UserName',avatartype,  req, res);
    }
}

function GetAvatar(csdns, type,avatartype, req, res){
    require('../UCBussiness/useravatar').GetAvatar(csdns, type,avatartype//JSON.parse(csdns)
        , function(dberr){
            res.send('res: {"err":99,"msg":"' + dberr + '"}');
        }
        , function(data){
            var jsonResult = [];
            for(var i=0 ; i<data.length ; i++){
                jsonResult.push({username:strHelper.ConvertStr(data[i].UserName),csdnid:data[i].CSDNID,avatarurl:strHelper.ConvertStr(data[i].qrcodeattachurl)});
            }
            var jsonAvatar = {err:0,msg:"ok",result:jsonResult};
            res.send(JSON.stringify(jsonAvatar));
        }
    );
}