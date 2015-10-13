/**
 * Created by Liujunjie on 13-12-23.
 */

module.exports={
    //上报数据
    uc_to_rc:{
	'push_user': 'http://internalapi.csdn.net/rc/push/pro_notify'
	,'TOKEN': 'XvuaaqkmoDqstvmsHxNaD59wH8EK'
    },
    //更新候选人的索引
    uc_to_myapi:{
        'changeperson': 'http://internalapi.csdn.net/myapi/person/update_index'
        ,'TOKEN': 'dzHFy4zm1z-4m-/7DN6DYKpEtYkK'
    },
    //积分系统IP和端口
    uc_to_score:{
	'scoreIP':'192.168.6.239'
	,'scorePort':9090
    }
    //同步passport
    ,passportdata:{
        //http://call.api.csdn.net/svc.passport/set/changeinfo
        'changeinfo': 'http://svc.passport.csdn.net/set/changeinfo'
        ,'changeemail': 'http://svc.passport.csdn.net/set/changeemail'
        ,'changemobile': 'http://svc.passport.csdn.net/set/changemobile'
        ,'domain': 'http://svc.passport.csdn.net/set/domain'
        ,'changenick': 'http://svc.passport.csdn.net/set/changenick'

        ,'TOKEN': 'uc_ydbfwqigrgbakgwetwegw_token'
        ,'push': true
    }
    //用户状态
    ,userstatus:{
        'original': 0 //初始
        ,'checked': 1 //通过审查
        ,'lock': 2
        ,'kill': 4
    }
    //联系方式
    ,contacttype:{
        'homepage': 10
        ,'hometelephone': 20
        ,'address': 30
        ,'companytelephone': 40
        ,'fax':50
        ,'weibo':60
        ,'qq':70
        ,'MSN':80
        ,'Skype':90
        ,'weixin':100
        ,'Gtalk':110
        ,'companyaddress':120
        ,'other':130
    },log:{
      'path':'uc.csdn.net/logs/log'
    },avatar:{
      'path':'uc.csdn.net/avatar'
    }
    //二维码地址
    ,qr:{
        ///opt/nodejs/website/Cloud-UserCenter/tmp/
        'path': '/data/web/Cloud-UserCenter/tmp/'
        ,'saveUrl':'http://ucph.csdn.net/'
    }
    //取个人信息时头像默认返回的大小尺寸
    ,avatarType:{
        //0-250*250 1-150*150 2-100*100 3-75*75
        type:1
    }
    //用户隐私,用户标记,教育经历,工作经历
    ,businessStauts:{
        'normal': 0
        ,'delete': 1
    }
    ,AuditWorkStatus : {
     notCheckedYet: 10//没有值不需要审核
    , validAndUnChecked: 20//有值未审核
    , validAndChecked: 30//有值已审核
}
    ,AuditEduStatus: {
        notCheckedYet: 10//没有值不需要审核
        , validAndUnChecked: 20//有值未审核
        , validAndChecked: 30//有值已审核
}
    ,AuditInfoStatus: {
        notCheckedYet: 10//没有值不需要审核
        , validAndUnChecked: 20//有值未审核
        , validAndChecked: 30//有值已审核
    }
    ,AuditSkillStatus: {
        notCheckedYet: 10//没有值不需要审核
        , validAndUnChecked: 20//有值未审核
        , validAndChecked: 30//有值已审核
    }
    ,orgStauts: {
        orgInitial:1000//1000 初始（未确认）
        ,orgReject:2000//2000 拒绝（拒绝）
        ,orgPass:3000//3000 有效（通过）
    }
};
