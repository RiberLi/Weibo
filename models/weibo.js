var dbContext=require("./../dbContext");
var sequelize=dbContext.sequelize;
var Sequelize=require("sequelize");

var user=require("./user");
var Weibo = sequelize.define("weibo",{
    id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
    title: {type:Sequelize.STRING(100),allowNull:false},
    content: {type:Sequelize.STRING(2000),allowNull:false},
    device: {type:Sequelize.STRING(100),allowNull:false},
    creator: {type:Sequelize.INTEGER,allowNull:false}
});

user.belongsTo(Weibo, {foreignKey: 'creator'})
module.exports = Weibo;