const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, {
  host: config.db.host,
  dialect: config.db.dialect,
  logging: config.db.logging ? console.log : false,
  operatorsAliases: false,
  pool: {
    max: 5,
    min: 0,
    idle: 20000,
    acquire: 20000
  },
  retry: {
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ],
    name: 'query',
    backoffBase: 100,
    backoffExponent: 1.1,
    timeout: 60 * 1000,
    max: Infinity
  }
});

const db = {};

fs.readdirSync(__dirname).filter(file => file.indexOf('.') !== 0 && file !== 'index.js').forEach((file) => {
  const model = sequelize.import(path.join(__dirname, file));

  db[model.name] = model;
});

Object.keys(db).forEach((modelName) => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
