'use strict';
const express = require('express');
const app = express();
const path = require('path');
const passport = require('passport');
const flash = require('connect-flash');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');

const LocalStrategy = require('passport-local').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;

const config = require('./config');
const db = require('./db');

app.use(cookieParser());
app.use(bodyParser());

app.use(session({ secret: 'secret12345' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((userObj, done) => {
    let users = db.get().collection('users');
    users.findOne({ "twitterId": userObj["twitterId"] }, (err, user) => {
        done(err, user);
    });
});

passport.use(new TwitterStrategy({
    consumerKey: config.twitter.c_key,
    consumerSecret: config.twitter.c_secret,
    callbackURL: `${config.hostName}/auth/twitter/callback`
}, (token, tokenSecret, profile, done) => {
    process.nextTick(function() {
        let users = db.get().collection('users');
        users.findOne({ "twitterId": profile.id }, (err, user) => {
            if (err) {
                return done(err);
            }
            if (user) {
                return done(null, user);
            } else {
                let newUser = {
                    "twitterId": profile.id,
                    "twitterToken": token,
                    "twitterUsername": profile.username,
                    "twitterDisplayName": profile.displayName
                };
                users.findAndModify({
                        "twitterId": profile.id
                    },
                    null, { $setOnInsert: newUser }, {
                        new: true,
                        fields: { twitterId: 1, twitterToken: 1, twitterUsername: 1, twitterDisplayName: 1, _id: 0 },
                        upsert: true,
                    }, (err, object) => {
                        if (err) {
                            console.log(err.message);
                        } else {
                            return done(null, newUser);
                        }
                    });
            }
        });
    });
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

app.get('/profile', (req, res) => {
    res.send(req.user);
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
        successRedirect: '/profile',
        failureRedirect: '/'
    }));

const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/');
}

app.get('failed', (req, res) => {
    res.send("Failed to authenticate");
});


db.connect(config.db.url, (err) => {
    if (err) {
        throw err;
        process.exit(1);
    } else {
        app.listen(config.port, () => {});
    }
});
