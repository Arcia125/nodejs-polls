module.exports = (({
  DEV,
  DBHOST,
  DBUSER,
  DBPW,
  DBPORT,
  DBNAME,
  PORT,
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET
}) => {
  return {
    port: PORT,
    isDev: DEV,
    hostName: DEV
      ? `http://localhost:${PORT}`
      : `https://nodejs-polls.herokuapp.com`,
    db: {
      host: DBHOST,
      user: DBUSER,
      pw: DBPW,
      port: DBPORT,
      name: DBNAME,
      url: `mongodb://${DBUSER}:${DBPW}@${DBHOST}:${DBPORT}/${DBNAME}`
    },
    twitter: {
      c_key: TWITTER_CONSUMER_KEY,
      c_secret: TWITTER_CONSUMER_SECRET
    }
  };
})(process.env);

if (require.main) {
  console.log(module.exports);
}
