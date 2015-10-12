var dbContext=require("./dbContext");
var users=dbContext.users;
module.exports.getUsers=function(params,err,callback){
	users.findAll().then(function(users){
         callback(users);
	});	
}