/**
 * Created by Liujunjie on 13-12-24.
 */

module.exports = function(){
    var Encoder = require('qr').Encoder;
    var encoder = new Encoder;
    var qr = {};

    qr.GetQrToFile = function(value, path){
//        encoder.on('end', function(){
//            // if you specify a file path, nothing will be passed to the end listener
//            // do something
//        });
        //encoder.on('error', function(err){
            //console.log('Qrerr:' + err);
            //applogger.log('Qrerr:' + err);
        //});
        encoder.encode(value, path);
    }

    qr.GetQrToButter = function(value, callback){
        encoder.on('end', function(png_data){
            // png_data is an instance of Buffer
            callback(png_data);
        });
        encoder.encode(value);
    }

    return qr;
}