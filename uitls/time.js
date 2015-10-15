/**
 * Created by Liujunjie on 13-11-25.
 */

module.exports = function()
{
    var time = {};

    time.now = function(){
        var today = new Date();
        var Y = today.getFullYear();
        var M = today.getMonth() + 1;
        var D = today.getDate();
        var H = today.getHours();
        var Minute = today.getMinutes();
        var S = today.getSeconds();
        return Y + '-' + M + '-' + D + ' ' + H + ':' + Minute + ':' + S;
    }

    time.shorttime = function(){
        var today = new Date();
        var Y = today.getFullYear();
        var M = today.getMonth() + 1;
        var D = today.getDate();
        return Y + '-' + M + '-' + D ;
    }

    time.jsDayToStr = function(timeStr){
        if(timeStr !='0000-00-00 00:00:00'){
            var today = new Date(timeStr);
            var Y = today.getFullYear();
            var M = today.getMonth() + 1;
            var D = today.getDate();
            return Y + '-' + M + '-' + D;
        }
        else{
            return null;
        }
    }
       
    time.jsDateTimeToStr = function(timeStr){
	if(timeStr){
	    var today = new Date(timeStr);
	    var Y = today.getFullYear();
	    if(isNaN(Y)) {
                Y = '0000';
            }
	    var M = today.getMonth() + 1;
	    if(M < 10){
		M = "0"+M;
	    }
	    if(isNaN(M)) {
                M = '00';  
            }
	    var D = today.getDate();
	    if(D < 10){
                D = "0"+D;
            }
	    if(isNaN(D)){
                D = '00';
            }
	    var H = today.getHours();
	    if(H < 10){
                H = "0"+H;
            }
	    if(isNaN(H)) {
                H = '00';  
            }
	    var Minute = today.getMinutes();
	    if(Minute < 10){
                Minute = "0"+Minute;
            }
	    if(isNaN(Minute)) {
                Minute = '00';  
            }
	    var S = today.getSeconds();
	    if(S < 10){
                S = "0"+S;
            }
	    if(isNaN(S)) {
                S = '00';
            }
	    return Y + '-' + M + '-' + D + ' ' + H + ':' + Minute + ':' + S;
	}
	else{
	    return null;
	}
    }    

    time.dateDiff = function(date1, date2) {

        date1 = new Date(date1).getTime();
        date2 = new Date(date2).getTime();

        return parseInt((date2 - date1) / (1000 * 60 * 60 * 24)); //结果是秒
    }

    return time;

}
