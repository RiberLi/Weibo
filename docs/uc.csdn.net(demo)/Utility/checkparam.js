/**
 * Created by Liujunjie on 14-1-15.
 */

module.exports = function(){
    var params = {};
    params.checkParams = function(param){
        if(param == null){
            return false;
        }
        else{
            if(typeof(param) == 'undefined'){
                return false;
            }
            else{
                return true;
            }
        }
    }
    params.getParams = function(req, param){
        var p = req.body[param];
        if(typeof(p) == 'undefined'){
            p = req.params[param];
            if(typeof(p) == 'undefined'){
                return null;
            }
            else{
                return p;
            }
        }
        else{
            return p;
        }
    }

    return params;
}