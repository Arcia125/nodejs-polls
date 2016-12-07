'use strict';

const config = {};
config.port = process.env.PORT;
config.isDev = !!process.env.DEV;
config.hostName = config.isDev ? `localhost:${config.port}` : 'https://nodejs-polls.herokuapp.com';

config.db = {};
config.db.host = process.env.DBHOST;
config.db.user = process.env.DBUSER;
config.db.pw = process.env.DBPW;
config.db.port = process.env.DBPORT;
config.db.name = process.env.DBNAME;
config.db.url = `mongodb://${config.db.user}:${config.db.pw}@${config.db.host}:${config.db.port}/${config.db.name}`;

config.twitter = {};
config.twitter.c_key = process.env.TWITTER_CONSUMER_KEY;
config.twitter.c_secret = process.env.TWITTER_CONSUMER_SECRET;

module.exports = config;