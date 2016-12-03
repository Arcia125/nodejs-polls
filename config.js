'use strict';

const config = {};

config.port = process.env.PORT || 3000;

config.db = {};
config.db.host = 'dsXXXXXX.mlab.com';
config.db.user = 'USERNAME';
config.db.pw = 'PASSWORD';
config.db.port = XXXXX;
config.db.name = 'DATABASE NAME';
config.db.url = `mongodb://${config.db.user}:${config.db.pw}@${config.db.host}:${config.db.port}/${config.db.name}`;

module.exports = config;