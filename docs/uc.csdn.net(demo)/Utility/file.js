/**
 * Created by Liujunjie on 14-1-3.
 */
module.exports = function(){
    var fs = require('fs');
    var OperPath = {};

    OperPath.CreatFile = function(path){
        var pathArr = path.split('/');
        var p = '';
        for(var i=0 ; i<pathArr.length ; i++){
            if(pathArr[i].length>0){
                if(i==0){
                    p = pathArr[i];
                }
                else{
                    p += '/' + pathArr[i];
                }
                if(!fs.existsSync(p)){
                    fs.mkdirSync(p);
                }
            }
        }
    }

    return OperPath;
}
