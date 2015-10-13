var UserReview = require('../UCBussiness/userreview');

module.exports.autoroute = {
    post: {
        '/userreview/getbycsdnid' : getbycsdnid
        ,'/userreview/getbyusername': getbycsdnid
        ,'/userreview/savebycsdnid': savebycsdnid 
        ,'/userreview/savebyusername': savebycsdnid 
    }
};

function getbycsdnid(req, res){
	var csdnid = req.body.csdnid;
	if(!csdnid){
		res.send('{"err":101, "msg":"缺少csdnid/username参数"}')
	}
	else {
    UserReview.GetByCSDNID(csdnid,function(err,data){
        if(err){
            res.send(JSON.stringify({err:99,msg:err}));
        }else{
            var jsonResult = {err:0,msg:"ok",result:data};
            res.send(JSON.stringify(jsonResult));
        }    
    });
  }
}

function savebycsdnid(req,res){
    var csdnid = req.body.csdnid;
    var realname = req.body.realname;
    if(!csdnid){
        res.send('{"err":98, "msg":"缺少csdnid参数"}');
    }else if(!(realname == '1' || realname == '0')){
        res.send('{"err":98, "msg":"请检查realname 格式。"}');
    }
    else{
      UserReview.SaveByCSDNID(csdnid,realname,function(err,data){
        if(err){
          res.send(JSON.stringify({err:99,msg:err}));
        }else{
          res.send('{"err": 0, "msg": "ok","result":{"result":true}}'); 
        }      
      });
    }

}
