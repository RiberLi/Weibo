/**
 * Created by Liujunjie on 13-11-25.
 */

function updateSqlStr(){
    var sqlStrHelper = {};
    sqlStrHelper.sqlparams = {};

    sqlStrHelper.updateStr = function(params, items){
        var sql = '';
        sqlStrHelper.sqlparams = {};
        for(var info in params){
            for(var i=0 ; i<items.length ; i++){
                if(info === items[i].toLocaleLowerCase()){
                    if(sql === ''){
                        sql = 'UPDATE userinfo SET '
                    }
                    else{
                        sql += ', '
                    }
                    sql += items[i] + '=@' + items[i];
                    sqlStrHelper.sqlparams[items[i]] = params[info];
                    break;
                }
            }
        }
        return sql;
    }
}