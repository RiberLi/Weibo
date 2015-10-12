
module.exports.autoroute = {
    post: {
        '/' : getUsers
    }
};

/* GET users listing. */
function getUsers(req, res, next) {
  res.send('respond with a resource');
});
