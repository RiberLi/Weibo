
/*
 * GET home page.
 */
module.exports.autoroute = {
    get: {
        '/' : proxy
    }
};

function proxy(req, res){
  res.render('proxy');
}

