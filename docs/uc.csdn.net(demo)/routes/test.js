/**
 * Created by Liujunjie on 13-11-28.
 */

module.exports.autoroute = {
    get: {
        '/test' : getinfo
        ,'/test2' : getinfo2
    }
};

function getinfo(req, res){
    res.render('test');
}

function getinfo2(req, res){
    res.render('test2');
}