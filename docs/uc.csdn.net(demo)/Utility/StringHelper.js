/**
 * Created by Liujunjie on 13-12-2.
 */

module.exports = function(){
    var StringHelper = {};

    StringHelper.ConvertStr = function(str){
        if(str == null || typeof(str) == "undefined"){
            return '';
        }
        else{
						if(typeof(str)==="string"){
            	return str.replace(/</g,'&lt;');
						}
						else{
							return str;
						}
        }
    }
    StringHelper.ConvertInt = function(num){
        if(num == null || typeof(num) == "undefined"){
            return null;
        }
        else{
            return num;
        }
    }

    return StringHelper;
}
