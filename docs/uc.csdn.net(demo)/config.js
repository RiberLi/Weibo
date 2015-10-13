/**
 * Created by GuoJunfeng on 13-11-20.
 */
module.exports={
    redisconn:{
        uc:{
        host:"192.168.6.239",
        //host:"127.0.0.1",
        port:6379,
        type:"master"   //default value "master"
        }
        /*如果是主从结构，采用以下的配置
        ,uc:[{
            host:"192.168.4.214",
            port:6379,
            type:"master"
        },{
            host:"192.168.4.214",
            port:6379,
            type:"slaver"
        }]
        */
    },
    mysqlconn:{
        uc:[{
            type:"master",
            host:"192.168.6.205",
            user: 'uc',
            password: 'wlUMW5ekKegaNrq9EBuu',
            connectionLimit: 1000,
            database:'uc',
            port:3308
        },
        {
        type:"slave",
        host:"192.168.6.205",
        user: 'uc',
        password: 'wlUMW5ekKegaNrq9EBuu',
        connectionLimit: 1000,
        database:'uc',
        port:3308
        }]
        ,ucLog:[{
            type:"master",
            host:"192.168.6.205",
            user: 'uclog',
            password: 'wlUMW5ekKegaNrq9EBuu',
            database:'uclog',
            port:3308
        },
            {
                type:"slave",
                host:"192.168.6.205",
                user: 'uclog',
                password: 'wlUMW5ekKegaNrq9EBuu',
                database:'uclog',
                port:3308
            }]
        /*如果是单库采用以下的配置
        ,uc1:{
            type:"master",  //default value "master"
            host:"192.168.4.214",
            useruser: 'pongo',
            password: 'k123456',
            database:'usercenter',
            port:3306
        }
        */
    }
};
