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

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(userObj, done) {
    let users = db.get().collection('users');
    users.find({"twitter.id": userObj["twitter.id"]}, function(err, user) {
        done(err, user);
    });
});

passport.use(new TwitterStrategy({
    consumerKey: config.twitter.c_key,
    consumerSecret: config.twitter.c_secret,
    callbackURL: 'https://nodejs-polls.herokuapp.com/auth/twitter/callback'
}, function(token, tokenSecret, profile, done) {
    process.nextTick(function() {
        let users = db.get().collection('users');
        users.findOne({ "twitter.id": profile.id }, function(err, user) {
            if (err) {
                return done(err);
            }
            if (user) {
                return done(null, user);
            } else {
                let newUser = {
                    "twitter.id": profile.id,
                    "twitter.token": token,
                    "twitter.username": profile.username,
                    "twitter.displayName": profile.displayName
                };
                users.findAndModify({
                    "twitter.id": profile.id
                },
                [['_id', 'asc']],
                {$set: newUser}, function(err, object) {
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

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

app.get('/profile', function(req, res) {
    console.log(req.user);
    res.send("logged in");
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/');
}

app.get('failed', (req, res) => {
    res.send("Failed to authenticate");
});


db.connect(config.db.url, function(err) {
    if (err) {
        console.log('Unable to connect to Mongodb.');
        throw err;
        process.exit(1);
    } else {
        app.listen(config.port, () => {
            console.log(`App listening on port ${config.port}`);
        });
    }
});
