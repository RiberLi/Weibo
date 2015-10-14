var models = require("../models");
var User=models.User;

module.exports.getUsers=function(params,err,callback){
	User.findAll({include: [models.Weibo]}).then(function(users){
         callback(users);
	});	
}