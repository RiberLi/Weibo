"use strict";

module.exports = function(sequelize, DataTypes) {
  var Weibo = sequelize.define("Weibo",{
    id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    title: {type:DataTypes.STRING(100),allowNull:false},
    content: {type:DataTypes.STRING(2000),allowNull:false},
    device: {type:DataTypes.STRING(100),allowNull:false},
    creator: {type:DataTypes.INTEGER,allowNull:false}
   }, {
    classMethods: {
      associate: function(models) {
        Weibo.belongsTo(models.User, {
          onDelete: "CASCADE",
          foreignKey: {
            allowNull: false
          }
        });
      }
    }
  });

  return Weibo;
};
