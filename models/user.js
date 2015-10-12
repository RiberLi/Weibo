var dbContext=require("./../dbContext");
var sequelize=dbContext.sequelize;
var Sequelize=require("sequelize");
var User = sequelize.define("user",{
    id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
    name: {type:Sequelize.STRING(50),allowNull:false},
    password: {type:Sequelize.STRING(200),allowNull:true},
    email: {type:Sequelize.STRING(100),allowNull:true}
});
module.exports = User;