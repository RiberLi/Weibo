/**
 * Created by zlj on 13-11-22.
 */
var ConnConfig = require('../config').mysqlconn;
var sqlhelper = require("cloud-sqlhelper")(ConnConfig);

var strHelper = require('../Utility/StringHelper')();
var ConTime = require('../Utility/time')();

/*
通过csdnid,CertType获取
*/
function GetByCsdnidCertType(csdnid,certtype,callbackerr, callback){    
        var str = '';
        var sql = "SELECT * FROM usercert";
        sql += " WHERE CSDNID=@CSDNID and CertType=@CertType";
    
        var params = {'CSDNID': csdnid,'CertType':certtype};
        sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
            if(dberr){//数据库异常
                callbackerr(dberr);
            }
            else{//正常取回数据 写入redis 并返回
                for(var i=0 ; i < data.length ; i++) {
                    str = '{"certtype":'+data[i].CertType+',"realname":"'+strHelper.ConvertStr(data[i].RealName)+'","certno":"'+strHelper.ConvertStr(data[i].CertNo)+'","certvalistartdate":"'+ConTime.jsDayToStr(data[i].CertValiStartdate)+'","certvalienddate":"'+ConTime.jsDayToStr(data[i].CertValiEnddate)+'","certattachid":'+data[i].CertAttachIDs+',"certattachurl":"'+strHelper.ConvertStr(data[i].CertAttachUrls)+'","certflag":'+data[i].CertFlag+'}';
                    break;
                }
                if(str.length>0){
                    callback(str);
                }
                else{
                    callback('""');
                }
            }
        });
}    

/*
通过csdnid获取
*/
function GetByCSDNID(csdnid,callbackerr, callback){    
        var str = '';
        var sql = "SELECT * FROM usercert";
        sql += " WHERE CSDNID=@CSDNID";
    
        var params = {'CSDNID': csdnid};
        sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){
            if(dberr){//数据库异常
                callbackerr(dberr);
            }
            else{//正常取回数据 写入redis 并返回
                if(data.length>0){
                    str += '{"realname":"' + data[0].RealName + '","usercert":[';
                    var strusercert = "";
                    for(var i=0 ; i < data.length ; i++) {
                        if (i>0) {
                            strusercert += ",";
                        }
                        strusercert += '{"certtype":'+data[i].CertType+',"certno":"'+data[i].CertNo+'","certvalistartdate":"'+ConTime.jsDayToStr(data[i].CertValiStartdate)+'","certvalienddate":"'+ConTime.jsDayToStr(data[i].CertValiEnddate)+'","certattachid":'+data[i].CertAttachIDs+',"certattachurl":"'+data[i].CertAttachUrls+'","certflag":'+data[i].CertFlag+'}';
                    }
                    str += strusercert;
                    str += "]}";
                    callback(str);
                }
                else{
                    callback('""');
                }
            }
        });
}  

/*
添加修改
*/
function SaveByCSDNID(csdnid,usercertjson,username,clientip,callbackerr, callback) {
    var objusercert = usercertjson;//JSON.parse(usercertjson);
    
        var sql = "SELECT CertFlag FROM usercert ";
        sql += " WHERE CSDNID=@CSDNID and CertType=@CertType"; 
        var certflag = 0;

			
	var iUpate = 0;
	//更新
	for(var i=0; i < objusercert.length ; i++) {
		var params2={'CertType':objusercert[i].certtype,'CSDNID': csdnid};
		var params ={'CertType':objusercert[i].certtype,'CSDNID': csdnid};
		var sql2 = "select count(1) count from usercert where CSDNID=@CSDNID and CertType=@CertType ";
		sqlhelper.ExecuteDataTable("uc", sql, params, function(dberr, data){

			if(dberr){
				callbackerr(dberr);
			}
			else{
				for (var i = 0; i < data.length; i++) {
					certflag = data[0].CertFlag;
				}
				if (!certflag) {
					sqlhelper.ExecuteDataTable("uc", sql2, params2, function(dberr2, data2){
						if(dberr2){//数据库异常
							callbackerr(dberr2);
						} else {
							for(var i2=0 ; i2 < data2.length ; i2++) {
								var CertType = objusercert[iUpate].certtype;
								var RealName = objusercert[iUpate].realname;
								var CertNo = objusercert[iUpate].certno;
								var CertValiStartdate = objusercert[iUpate].certvalistartdate;
								var CertValiEnddate = objusercert[iUpate].certvalienddate;
								var AddIP =clientip;
								var CertAttachIDs;
								var CertAttachUrls;
								for (var j = 0; j < objusercert[iUpate].certattach.length; j++) {
									if (!CertAttachIDs) {
										CertAttachIDs = objusercert[iUpate].certattach[j].certattachid;
									} else {
										CertAttachIDs =CertAttachIDs+","+ objusercert[iUpate].certattach[j].certattachid;
									}
									if (!CertAttachUrls) {
										CertAttachUrls = objusercert[iUpate].certattach[j].certfileurl;
									} else {
										CertAttachUrls = CertAttachUrls+","+objusercert[iUpate].certattach[j].certfileurl;
									}
								}
								//var VerifiedStatus = objusercert[iUpate].verifiedstatus;
								//var VerifiedCSDNID = objusercert.usercert[i].VerifiedCSDNID;
								//var VerifiedDate = objusercert.usercert[i].VerifiedDate;
								var params3 = {'CSDNID': csdnid,'UserName':username,'CertType':CertType,'CertNo':CertNo,'RealName':RealName,
								'CertValiStartdate':CertValiStartdate,'CertValiEnddate':CertValiEnddate,
								'AddIP':AddIP,'CertAttachIDs':CertAttachIDs,'CertAttachUrls':CertAttachUrls};
								if (parseInt(data2[i2].count) == 0) {
									//新增
									var sql3 = "insert into usercert(" +
									"CSDNID,UserName,CertType,RealName,CertNo,CertValiStartdate,CertValiEnddate,AddDate,AddIP,CertAttachIDs,CertAttachUrls,VerifiedStatus" +
									") values(" +
									"@CSDNID,@UserName,@CertType,@RealName,@CertNo,@CertValiStartdate,@CertValiEnddate,NOW(),@AddIP,@CertAttachIDs,@CertAttachUrls,0" +
									")";
									sqlhelper.ExecuteDataTable("uc", sql3, params3, function(dberr3, data3){
										if(dberr3){//数据库异常
											callbackerr(dberr3);
										} else {
											iUpate++;
											if (iUpate == data2.length || data2.length==0) {
												callback(params3['CertType']);
											}
										}
									});
								} else {
									//更新
									var sql4 = "update usercert set " +
									"UserName=@UserName,CertNo=@CertNo,RealName=@RealName,CertValiStartdate=@CertValiStartdate,CertValiEnddate=@CertValiEnddate,AddDate=NOW(),AddIP=@AddIP,CertAttachIDs=@CertAttachIDs,CertAttachUrls=@CertAttachUrls" +
									" where CSDNID=@CSDNID and CertType=@CertType ";
									sqlhelper.ExecuteDataTable("uc", sql4, params3, function(dberr3, data3){
										if(dberr3){//数据库异常
											callbackerr(dberr3);
										} else {
											iUpate++;
											if (iUpate == data2.length || data2.length==0) {
												callback(params3['CertType']);
											}
										}
									});
								}
							}
						}
					});
              			}
				else{
					callbackerr("该信息已被认证不允许修改");
				}
			}
	
    		});
	}
}  

function SaveCertFlagByCSDNID(CSDNID,params,callbackerr, callback){

	var certflag = params.certflag;
	var sql = "SELECT RealName FROM usercert ";
        sql += " WHERE CSDNID=@CSDNID";
  
        var sqlparams = {'CSDNID': CSDNID};
        sqlhelper.ExecuteDataTable("uc", sql, sqlparams, function(dberr, data){
        	if(dberr){//数据库异常
                	callbackerr(dberr);
              	}
		else {
			if(certflag==0){
				var sql2 = 'UPDATE usercert set CertFlag=@CertFlag';
				sql2 += ' WHERE CSDNID=@CSDNID and CertType=@CertType';
				var sqlparams2 = {};
				sqlparams2['CertFlag'] = certflag;
				sqlparams2['CSDNID'] = CSDNID;
				sqlparams2['CertType'] = params.certtype;
				
				sqlhelper.ExecuteNoQuery('uc', sql2, sqlparams2, function(dberr, Count){

					if(dberr){
						callbackerr(dberr);
					}
					else{
						console.log(Count)
						if(Count>0){
							callback(true);
						}
						else{
							callbackerr('保存失败，影响行数为0');
						}
					}
				});
			}
			else if(certflag==1){
				var realname = data[0]['RealName'];
				var sql3 = 'UPDATE userinfo set RealName=@RealName';
				sql3 += ' WHERE CSDNID=@CSDNID'
				var sqlparams3 = {};
				sqlparams3['CSDNID'] = CSDNID;
				sqlparams3['RealName'] = realname;
				sqlhelper.ExecuteNoQuery('uc', sql3, sqlparams3, function(dberr, Count){
					if(dberr){
                                                 callbackerr(dberr);
                                        }
                                        else{   
                
						if(Count>0){
                                                        var sql2 = 'UPDATE usercert set CertFlag=@CertFlag';
                           			        sql2 += ' WHERE CSDNID=@CSDNID and CertType=@CertType';
		                                        var sqlparams2 = {};
		                                        sqlparams2['CertFlag'] = params.certflag;
					                sqlparams2['CSDNID'] = CSDNID;
		                                        sqlparams2['CertType'] = params.certtype;
		                                        sqlhelper.ExecuteNoQuery('uc', sql2, sqlparams2, function(dberr, Count2){
                                         
			                                         if(dberr){
			                                                 callbackerr(dberr);
	                     		                         }
			                                         else{   
                         		                         	if(Count2>0){
                                                       	 			callback(true);
	                     	                           		}
			                                                else{   
                                                 				callbackerr('保存失败，影响行数为0');                                                }
                                         			}
                                 			});
                                                }
					}
				});
			}
			else{
				callbackerr('认证失败');
			}
		}

	});	

}

exports.GetByCsdnidCertTypeModule = GetByCsdnidCertType;

exports.GetByCSDNIDModule = GetByCSDNID;

exports.SaveByCSDNIDModeule = SaveByCSDNID;

exports.SaveCertFlag = SaveCertFlagByCSDNID;
