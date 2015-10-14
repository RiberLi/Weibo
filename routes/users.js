
module.exports.autoroute = {
    get: {
        '/users' : getUsers
    }
};

/* GET users listing. */
function getUsers(req, res, next) {
  var userManager=require("./../../managers/userManager")
	userManager.getUsers(null,null,function(users){
		   res.send(users);
    })
};
