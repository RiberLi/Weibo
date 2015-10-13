var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);
var async = require('async');


//获取感兴趣的领域
function getbyid(CSDNID,UserName,callbackerr, callback){
	var sql = "SELECT * FROM userinterest WHERE CSDNID=@CSDNID and FromSystem=@FromSystem ";
        var params = {'CSDNID': CSDNID,'FromSystem':0};
        sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
        	if(dberr){//数据库异常
	                callbackerr(dberr);
                }
                else{//正常取回数据
			callback(data);
                }
        });
}
//取系统推荐领域
function getsysbyid(CSDNID,UserName,callbackerr, callback){
	var sql = "SELECT * FROM userinterest WHERE CSDNID=@CSDNID and FromSystem=@FromSystem ";
        var params = {'CSDNID': CSDNID,'FromSystem':1};
        sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
                if(dberr){//数据库异常
                        callbackerr(dberr);
                }
                else{//正常取回数据
                        if(data.length > 0){
                                callback(data);
                        }
                        else {	
				require("../routes/userinterest").GetInterestByid(CSDNID,UserName,function(err,resultlist){
					if(err){
						callbackerr(err);
					}
					else {
						if(resultlist.length > 0){
							callback(data);
						}
						else {
							insertdata(CSDNID,UserName,function(err,data){
                                        			if(err){
                                                			callbackerr(dberr);
                                        			}
                                        			else {
                                                			callback(data);
                                        			}
                                			});
						}
					}
				});
			}
		}
	});
}

function insertdata (CSDNID,UserName,callback){
	var data = ["游戏开发","移动开发","网站开发","web前端","智能硬件","物联网","信息安全","系统运维","架构设计","开源工具","云计算","软件测试","电子商务","OA办公","图像处理","多媒体处理","虚拟化技术","大数据","BI商业智能","数学算法","操作系统","企业ERP/CRM","项目管理","产品设计"];
	var number = 5;
	var datalist = getDataRandom(data,number);	
	async.map(datalist,function(item,cb){
		var sql = "INSERT INTO userinterest (CSDNID,UserName,InterestName,Status,FromSystem) VALUES (@CSDNID,@UserName,@InterestName,@Status,@FromSystem) ";
		var sqlparams = {};
		sqlparams['CSDNID'] = CSDNID;
		sqlparams['UserName'] = UserName;
		sqlparams['InterestName'] = item;
		sqlparams['Status'] = require('../appconfig').businessStauts.normal;
		sqlparams['FromSystem'] = 1;
		sqlhelper.ExecuteInsert('uc', sql, sqlparams, function(dberr, ID){
			if(dberr){
                        	cb(dberr);
                        }
			else {
				cb(null,ID)
			}
		});
	},function(err,res){
		if(res){
			var sql = "SELECT * FROM userinterest WHERE CSDNID=@CSDNID and FromSystem=@FromSystem";
        		var params = {'CSDNID': CSDNID,'FromSystem':1};
        		sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
                		if(dberr){//数据库异常
                        		callbackerr(dberr);
                		}
                		else{//正常取回数据
                        		if(data.length > 0){
                                		callback(null,data);
                        		}
				}
			});
		}
	});
}

//随机获取领域
function getDataRandom(data,number){
	var datalist = [];
	var flag;
	while(datalist.length<number){
		var k = Math.floor(Math.random()*data.length+1);
		flag=true;
		for(var j=0;j<datalist.length;j++){
			if(datalist[j] == data[k]){
				flag = false;
				break;
			}
		}
		if(flag)
			datalist.push(data[k]);
	}
	return datalist;
}

//用户保存推荐领域
function savebyinterestid(CSDNID,params,callbackerr,callback){
	var sql = 'UPDATE userinterest set ';
	var sqlparams = {};
	if(params.interestid > 0){
		sql += 'FromSystem=@FromSystem'
		sql += ' WHERE InterestID=@InterestID and CSDNID=@CSDNID';
		sqlparams['FromSystem'] = 0;
		sqlparams['InterestID'] = params.interestid;
		sqlparams['CSDNID'] = CSDNID;
		sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
                	if(dberr){
                    		callbackerr(dberr);
                    	}
                    	else{
                       		if(Count>0){
                            		callback(params.interestid);
                        	}
                        	else{
                           		callbackerr('保存失败，影响行数为0');
                        	}
                    	}
                });
	}
	else if(params.interestid == 0){
		//insert
		var fields = '';
		var values = '';
		sql = 'INSERT INTO userinterest '
		fields = '(CSDNID,UserName,FromSystem,InterestName,Status';
		values = '(@CSDNID,@UserName,@FromSystem,@InterestName,'+require('../appconfig').businessStauts.normal;
		var flag = false;
		if(!params.interestname){
			callbackerr("添加领域需要添加interestname参数")
		}
		else{
			sqlparams['InterestName'] = params.interestname;
			var async = require('async');
        		async.waterfall([
				function(cb){
					require("../routes/userinterest").GetInterestByid(CSDNID,params.username,function(err,list){
						if(err){
							cb(err,null);
						}
						else{
							var flag = true;
							for(var k=0;k<list.length;k++){
								if(list[k].InterestName===sqlparams['InterestName'] && list[k].Status===require('../appconfig').businessStauts.normal && list[k].FromSystem===0){
									flag=false;
									break;
								}
							}
							cb(null,flag);
						}
					});
				},function(arg1,cb){
					if(arg1 === false){
						cb('已添加过该领域',null);
					}	
					else{
						require("../routes/userinterest").GetSysInterestByid(CSDNID,params.username,function(err,resultlist){
							if(err){
								cb(err,null,null);	
							}
							else{
								var flag = true;
								var checkID = 0;
                                                		for(var k=0;k<resultlist.length;k++){
                                                        		if(resultlist[k].InterestName===sqlparams['InterestName'] && resultlist[k].Status===require('../appconfig').businessStauts.normal && resultlist[k].FromSystem===1){
                                                                		flag=false;
										checkID = resultlist[k].InterestID;
                                                                		break;
                                                        		}
                                                		}
                                                		cb(null,flag,checkID);
							}
						});
					}
				},function(arg1,arg2,cb){
					if(arg1===false){
						var syssql = "UPDATE userinterest SET InterestName=@InterestName,FromSystem=@FromSystem WHERE InterestID=@InterestID "
						var sysparams = {'InterestName':sqlparams['InterestName'],'FromSystem':0,'InterestID':arg2};
						sqlhelper.ExecuteNoQuery('uc', syssql, sysparams, function(dberr, Count){
							if(dberr){
								cb(dberr,null);
							}
							else{
								if(Count>0){
									cb(null,arg2);
								}
								else{
									cb('保存失败，影响行数为0',null);
								}
							}
						});
					}
					else{
						fields += ')';
						values += ')';
                           	                sqlparams['CSDNID'] = CSDNID;
                                	        sqlparams['UserName'] = params.username;
                                        	sqlparams['FromSystem'] = 0;
                                        	sql += fields + ' VALUES ' + values;
                                        	sqlhelper.ExecuteInsert('uc', sql, sqlparams, function(dberr, ID){
							if(dberr){
								cb(dberr,null);
							}
							else{
								cb(null,ID)
							}
						});
					}
				}
			],function(err,result){
				if(err){
                       		 	callbackerr(err);
                		}
                		else{
                        		callback(result)
                		}
			});
		}
	}
	else {
		callbackerr('无效interestid');
	}
}

//删除领域
function deletebycsdnid(CSDNID,interestid,callback){
	var sql = 'UPDATE userinterest set Status=@Status where InterestID=@InterestID and CSDNID=@CSDNID'
    	var sqlparams = {'InterestID':interestid,'CSDNID':CSDNID,'Status':require('../appconfig').businessStauts.delete};
    	sqlhelper.ExecuteNoQuery('uc', sql, sqlparams, function(dberr, Count){
            if(dberr){
                callback(dberr,null);
            }
            else{
                if(Count>0){
                    callback(null, interestid);
                }
                else{
                    callback('保存失败，影响行数为0', null);
                }
            }
        });
}

exports.GetbyIDModule = getbyid;
exports.GetSysbyIDModule = getsysbyid;
exports.DeleteByCSDNID = deletebycsdnid;
exports.SaveByInterestID = savebyinterestid;
