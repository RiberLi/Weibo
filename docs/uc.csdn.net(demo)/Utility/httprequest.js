/**
 * Created by Liujunjie on 13-12-17.
 */

module.exports = function(){
    var httprequest = {};

    httprequest.getData = function(url, method, params,token,callbackerr, callback){
        var request = require('request');
        params['appname'] = 'uc';
        var post_options = {
            url: url
            , method: method //'GET' //'POST'
            , form: params
            , headers: {
               //'Content-Type': 'application/json; charset=UTF-8'
               'X-ACL-TOKEN': token
            }
        };
        request(post_options, function (error, response, body) {
            if (error) {// && response.statusCode == 200
                callbackerr(error);
            }
            else{
                callback(body);
            }
        });
    }

    httprequest.getDataBody = function(url, method, params,token,callbackerr, callback){
        var request = require('request');
        params['appname'] = 'uc';
        var post_options = {
            url: url
            , method: method //'GET' //'POST'
            , body: params
            , json:true
            , headers: {
               //'Content-Type': 'application/json; charset=UTF-8'
               'X-ACL-TOKEN': token
            }
        };
        request(post_options, function (error, response, body) {
            if (error) {// && response.statusCode == 200
                callbackerr(error);
            }
            else{
                callback(body);
            }
        });
    }

    return httprequest;
}
