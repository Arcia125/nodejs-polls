'use strict';

const express = require(`express`);
const app = express();

const passport = require(`passport`);
const flash = require(`connect-flash`);

const expressStatic = require(`express-static`);
const cookieParser = require(`cookie-parser`);
const bodyParser = require(`body-parser`);
const session = require(`express-session`);

const TwitterStrategy = require(`passport-twitter`).Strategy;


const config = require(`./config`);
const db = require(`./db`);

passport.use(new TwitterStrategy({
  consumerKey: config.twitter.c_key,
  consumerSecret: config.twitter.c_secret,
  callbackURL: `${config.hostName}/auth/twitter/callback`,
}, (token, tokenSecret, profile, done) => {
  process.nextTick(() => {
    const users = db.get().collection(`users`);
    users.findOne({ "twitterId": profile.id }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (user) {
        return done(null, user);
      } else {
        const newUser = {
          "twitterId": profile.id,
          "twitterToken": token,
          "twitterUsername": profile.username,
          "twitterDisplayName": profile.displayName,
        };
        users.findAndModify({
          "twitterId": profile.id,
        },
        null, { $setOnInsert: newUser }, {
          new: true,
          fields: { twitterId: 1, twitterToken: 1, twitterUsername: 1, twitterDisplayName: 1, _id: 0 },
          upsert: true,
        }, (er, object) => {
          if (er) {
            console.log(err.message);
            return done(err);
          } else {
            return done(null, newUser);
          }
        });
      }
    });
  });
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((userObj, done) => {
  const users = db.get().collection(`users`);
  users.findOne({ "twitterId": userObj.twitterId }, (err, user) => {
    done(err, user);
  });
});

app.set(`view engine`, `ejs`);

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(expressStatic(`${__dirname}/views`));
app.use(session({ secret: `secret12345`, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.get(`/`, (req, res, next) => {
  const pollsCollection = db.get().collection(`polls`);
  pollsCollection.find({}).sort({ timestamp: -1 }).toArray((err, docs) => {
    if (err) {
      console.log(err);
      return;
    }
    const username = req.user ? req.user.twitterUsername : null;
    const polls = docs.length > 0 ? docs : null;
    const flashMsg = req.flash(`info`) || null;
    res.render(`index`, { username, polls, expressFlash: flashMsg });
  });
});

app.get(`/polls/new`, (req, res) => {
  if (!req.user) {
    req.flash(`info`, `You have to be a registered user to create a new poll.`);
    res.redirect(`/`);
    return;
  }
  res.render(`newpoll`, { username: req.user.twitterUsername });
});

app.post(`/polls/create`, (req, res) => {
  if (!req.user) {
    req.flash(`info`, `You have to be a registered user to create a new poll.`);
    res.redirect(`/`);
    return;
  }
  const pollsCollection = db.get().collection(`polls`);
  const choices = req.body.choices.split(`, `).map(choice => ({ name: choice, votes: 0 }));
  pollsCollection.insertOne({
    timestamp: Date.now(),
    user: req.user.twitterId,
    title: req.body.title,
    choices,
    voters: [],
  });
  req.flash(`info`, `You have created the poll ${req.body.title}`);
  res.redirect(`/`);
});

app.get(`/auth/twitter`, passport.authenticate(`twitter`));

app.get(`/auth/twitter/callback`,
    passport.authenticate(`twitter`, {
      successRedirect: `/`,
      failureRedirect: `/`,
    }));

app.get(`/logout`, (req, res) => {
  req.logout();
  res.redirect(`/`);
});

app.get(`/user`, (req, res) => {
  if (!req.user) {
    req.flash(`info`, `You are not signed in.`);
    res.redirect(`/`);
    return;
  }
  const pollsCollection = db.get().collection(`polls`);
  pollsCollection.find({ user: req.user.twitterId }).sort({ timestamp: -1 }).toArray((err, docs) => {
    if (err) {
      console.log(err);
      return;
    }
    const username = req.user ? req.user.twitterUsername : null;
    const polls = docs.length > 0 ? docs : null;
    const flashMsg = req.flash(`info`) || null;
    res.render(`user`, { username, polls, expressFlash: flashMsg });
  });
});

app.get(`/polls/:pollID`, (req, res) => {
  const pollsCollection = db.get().collection(`polls`);
  try {
    db.findById(req.params.pollID, pollsCollection, (err, poll) => {
      if (err) {
        console.log(err);
        return;
      }
      const username = req.user ? req.user.twitterUsername : null;
      const flashMsg = req.flash(`info`) || null;
      res.render(`poll`, { username, poll, expressFlash: flashMsg });
    });
  }
  catch (e) {
    req.flash(`info`, `Poll not found.`);
    res.redirect(`/`);
  }
});

app.post(`/polls/vote/:pollID`, (req, res) => {
  const pollsCollection = db.get().collection(`polls`);

  pollsCollection.updateOne({
    "_id": db.oID(req.params.pollID),
    "choices.name": req.body.choices,
  }, {
    $inc: { "choices.$.votes": 1 },
  }, (err, data) => {
    if (err) {
      console.log(err);
    }
    req.flash(`info`, `You voted for ${req.body.choices}.`);
    res.redirect(`/`);
  });
});

app.get(`/polls/delete/:pollID`, (req, res) => {
  if (!req.user) {
    req.flash(`info`, `You must be logged in to delete polls.`);
    res.redirect(`/`);
    return;
  }
  const pollsCollection = db.get().collection(`polls`);
  db.findById(req.params.pollID, pollsCollection, (findOneError, poll) => {
    if (findOneError) {
      console.log(findOneError);
    }
    if (!(req.user.twitterId === poll.user)) {
      req.flash(`info`, `You are not authorized to delete this poll.`);
      res.redirect(`/`);
      return;
    }
    pollsCollection.findAndRemove({
      "_id": db.oID(req.params.pollID),
    }, null, (findAndRemoveErr, doc) => {
      if (findAndRemoveErr) {
        console.log(findAndRemoveErr);
      }
      req.flash(`info`, `You removed the poll titled:${doc.value.title}.`);
      res.redirect(`/`);
      return;
    });
  });
});

app.post(`/polls/newchoice/:pollID`, (req, res) => {
  if (!req.user) {
    req.flash(`info`, `You must be logged into create a new poll option.`);
  }
  const pollsCollection = db.get().collection(`polls`);
  pollsCollection.updateOne({
    "_id": db.oID(req.params.pollID),
  }, {
    $push: { "choices": { name: req.body.choice, votes: 0 } },
  }, (err, poll) => {
    if (err) {
      console.log(err);
    }
    req.flash(`info`, `You added the option:${req.body.choice}.`);
    res.redirect(`/`);
  });
});

db.connect(config.db.url, (err) => {
  if (err) {
    throw err;
  } else {
    app.listen(config.port, () => {
      console.log(`App listening on port:${config.port}`);
    });
  }
});
