const SequelizeTokenify = require('sequelize-tokenify');

module.exports = (sequelize, DataTypes) => {
  const shorturl = sequelize.define('shorturl', {
    id: {
      type: DataTypes.INTEGER(11),
      autoIncrement: true,
      primaryKey: true
    },
    redirectToken: {
      type: DataTypes.STRING
    },
    redirectTarget: {
      type: DataTypes.STRING
    }
  });

  SequelizeTokenify.tokenify(shorturl, {
    field: 'redirectToken',
    length: 6
  });

  return shorturl;
};
