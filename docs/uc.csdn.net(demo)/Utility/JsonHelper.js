/**
 * Created by Liujunjie on 13-11-29.
 */

function selectItemFromJson(originJson, itmes){
    var json = {};
    for(var oj in originJson){
        for(var i=0 ; i<itmes.length ; i++)
        {
            if(itmes[i].toLocaleLowerCase() === oj.toLocaleLowerCase()){
                json[oj] = originJson[oj];
                break;
            }
        }
    }
    return json;
}

exports.SelectItemFromJson = selectItemFromJson;