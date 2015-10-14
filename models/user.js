"use strict";

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    name: {type:DataTypes.STRING(50),allowNull:false},
    password: {type:DataTypes.STRING(200),allowNull:true},
    email: {type:DataTypes.STRING(100),allowNull:true}
    }, {
    classMethods: {
      associate: function(models) {
        User.hasMany(models.Weibo)
      }
    }
    });
    return User;
};
