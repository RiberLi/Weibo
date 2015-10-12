module.exports.autoroute = {
    post: {
        '/' : index
    }
};

function index(req, res, next) {
  res.render('index', { title: 'Express' });
});
