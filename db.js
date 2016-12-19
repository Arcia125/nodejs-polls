'use strict';

const mongo = require(`mongodb`).MongoClient;

const state = {
  db: null,
};

module.exports.connect = (url, done) => {
  if (state.db) return done();
  mongo.connect(url, (err, db) => {
    if (err) return done(err);
    state.db = db;
    done();
  });
};

module.exports.get = () => state.db;


module.exports.close = (done) => {
  if (state.db) {
    state.db.close((err, result) => {
      state.db = null;
      state.mode = null;
      done(err);
    });
  }
};
