

module.exports = function(){
    var redis = require('redis');
    var redisconn = require('../config').redisconn;
    if(global.redishelper){
      return global.redishelper;
    }
    else{
	var redishelper = {};
    }
//    var fix = key.split('_')[0];
//    var dbinfo = RedisRoute(fix);
    var dbinfo = 'uc';
    var RedisConfig = redisconn[dbinfo];
    var RedisClent = redis.createClient(RedisConfig.port, RedisConfig.host);
    
    //var RedisConfig = redisconn.uc;
    //console.log(RedisConfig.port + ',' + RedisConfig.host);

    redishelper.get = function(key, callback){
        RedisClent.get(key, function(err, reply){
            callback(err, reply);
        });
    }

    redishelper.set = function(key, value, expire){
        RedisClent.set(key, value);

        if(expire && expire > 0){
            RedisClent.expire(key, expire);
        }
    }

    /**
     * @param {Array} keys
     * @param {function(Object, Array)} callback
    */
    redishelper.mget = function(keys, callback){
        if(keys.constructor != Array){
            callback("传入参数keys必须为数组", null);
            return;
        }

        if(keys.length == 0){
            callback("传入参数keys为空", null);
            return;
        }


        RedisClent.mget(keys, function(err,replies){
            callback(err, replies);
        });
    }

    /**
     * @param {Array} keys
     * @value {String} value
     * @param {function(Object, Array)} callback
     */
    redishelper.mset = function(keys, value, callback){
        if(keys.constructor != Array){
            callback("传入参数keys必须为数组", null);
            return;
        }

        if(keys.length == 0){
            callback("传入参数keys为空", null);
            return;
        }


        var setvalues = [];
        keys.forEach(function(d){
            setvalues.push(d);
            setvalues.push(value);
        });

        RedisClent.mset(setvalues, function(err,result){
            callback(err, result);
        });
    };


    redishelper.delete = function(key){
        RedisClent.del(key);
    }
    redishelper.hgetall = function(key,callback){
        RedisClent.hgetall(key,callback);
    }
    redishelper.hset = function(key,field,value){
      RedisClent.hset(key,field,value);
    }
    redishelper.hget = function(key,field,callback){
      RedisClent.hget(key,field,callback);
    }
    //return redis.createClient(RedisConfig.port, RedisConfig.host);
    global.redishelper = redishelper;
    return global.redishelper;
};

function RedisRoute(fix){
    var route = {};
    route['userinfo'] = 'uc';
    route['uname'] = 'uc';
    route['nick'] = 'uc';
    route['domain'] = 'uc';
    route['usercontact'] = 'uc';
    route['useredu'] = 'uc';
    route['userskill'] = 'uc';
    route['userprivacy'] = 'uc';
    route['codeclass'] = 'uc';
    route['codeitem'] = 'uc';
    route['usercert'] = 'uc';
    route['userercode'] = 'uc';
    route['userworkexp'] = 'uc';
    route['usercv'] = 'uc';
    route['userfile'] = 'uc';
    route['usermark'] = 'uc';
    route['nickname'] = 'uc';
    route['csdnid'] = 'uc';
    route['loginemail'] = 'uc';
    route['selfdomain'] = 'uc';
    route['orgbaseinfo'] = 'uc';
    return route[fix];
}
