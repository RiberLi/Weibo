
/*
 * GET users listing.
 */
module.exports.autoroute = {
    get: {
        '/users' : list
    }
};

function list(req, res){
  res.send("respond with a resource");
}