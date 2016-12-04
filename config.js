'use strict';

const config = {};
config.port = process.env.PORT;

config.db = {};
config.db.host = process.env.DBHOST;
config.db.user = process.env.DBUSER;
config.db.pw = process.env.DBPW;
config.db.port = process.env.DBPORT;
config.db.name = process.env.DBNAME;
config.db.url = `mongodb://${config.db.user}:${config.db.pw}@${config.db.host}:${config.db.port}/${config.db.name}`;

module.exports = config;