module.exports.autoroute = {
    get: {
        '/' : index
    }
};	

function index(req, res, next) {
  res.render('index', { title: 'Express' });
};
