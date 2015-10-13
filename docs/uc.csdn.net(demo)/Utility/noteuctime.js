
module.exports = function()
{
    var log = {};
    var logger = require('./logger.js');
    
    log.ucTimeLog = function(url, diff_time, action) {
    	var params = {};
        var time = require('../Utility/time')();
        params['OperateDate'] = time.now();
        params['RequestUrl'] = url;
        params['RequsetTime'] = diff_time+'ms';
	params['RequsetAction'] = action;
        logger.info(JSON.stringify(params));
    }
    return log;
}
