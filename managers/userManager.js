var models = require("../models");
var User=models.User;

module.exports.getUsers=function(params,err,callback){
	User.findAll().then(function(users){
         callback(users);
	});	
}