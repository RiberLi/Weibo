var Sequelize=require("sequelize");
var sequelize = new Sequelize('nodejs', 'root', 'root', {host : 'localhost', port : '3306', dialect : 'mysql'});
module.exports.sequelize=sequelize;

var models={
    users:require("./models/user"),
    weibos:require("./models/weibo")
}

module.exports.initDatabase=function(){
     for(var i in models)
     {
         var model=models[i];         	
         model.sync({force: true});
     }
}
module.exports.models=models;