'use strict';
const express = require('express');
const app = express();
const path = require('path');
const passport = require('passport');
const flash = require('connect-flash');

const expressStatic = require('express-static');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');

const LocalStrategy = require('passport-local').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;


const config = require('./config');
const db = require('./db');

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
    let users = db.get().collection('users');
    users.findOne({ "twitterId": userObj["twitterId"] }, (err, user) => {
        done(err, user);
    });
});

app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(expressStatic(__dirname + '/views'));
app.use(session({ secret: 'secret12345', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.get('/', (req, res, next) => {
    let pollsCollection = db.get().collection('polls');
    pollsCollection.find({}).toArray((err, docs) => {
        if (err) {
            console.log(err);
            return;
        }
        const username = req.user ? req.user.twitterUsername : null;
        const polls = docs.length > 0 ? docs : null;
        const flashMsg = req.flash('info') || null;
        res.render("index", { username: username, polls: polls, expressFlash: flashMsg });
    });
});

app.get('/polls/new', (req, res) => {
    if (!req.user) {
        req.flash('info', 'You have to be a registered user to create a new poll.');
        res.redirect('/');
        return;
    }
    res.render("newpoll", { username: req.user.twitterUsername });
});

app.post('/polls/create', (req, res) => {
    if (!req.user) {
        req.flash('info', 'You have to be a registered user to create a new poll.');
        res.redirect('/');
        return;
    }
    let pollsCollection = db.get().collection('polls');
    let choices = req.body.choices.split(', ').map(choice => {
        return { name: choice, votes: 0 };
    });
    pollsCollection.insertOne({
        timestamp: Date.now(),
        user: req.user.twitterId,
        title: req.body.title,
        choices: choices
    });
    res.redirect('/');
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
        successRedirect: '/',
        failureRedirect: '/'
}));

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

db.connect(config.db.url, (err) => {
    if (err) {
        throw err;
        process.exit(1);
    } else {
        app.listen(config.port, () => {
            console.log(`App listening on port:${config.port}`);
        });
    }
});
