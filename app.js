'use strict';
const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const serveStatic = require('serve-static');
const bodyParser = require('body-parser');
const expressSession = require('express-session');

const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;

const config = require('./config');
const db = require('./db');



passport.use(new localStrategy(
    function(username, password, done) {
        User.findOne({ username: username }, function (err, user) {
            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }

            if (!user.validPassword(password)) {
                return done(null, false, { message: 'Incorrect password'})
            }

            return done(null, user);
        });
    }
));

passport.use(new TwitterStrategy({
    consumerKey: config.twitter.c_key,
    consumerSecret: config.twitter.c_secret,
    callbackURL: `${config.hostName}/auth/twitter/callback`
    },
    function(token, tokenSecret, profile, done) {
        // User.findOrCreate(..., function(err, user) {
        //     if (err) {
        //         return done(err);
        //     }
        //     done(null, user);
        // });
        done(null, token);
        console.log(token, tokenSecret, profile, done);
    }
));




app.use(serveStatic('public'));
app.use(cookieParser());
app.use(bodyParser());
app.use(expressSession({ secret: 'test1' }));
app.use(passport.initialize());
app.use(passport.session());
// app.use(app.router);


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/login' }), (req, res) => {
        res.redirect('/');
    });

app.get('/login', (req, res) => {
    res.send(path.join(__dirname, '/views/index.html'));
});

app.get('/api/search/:search', (req, res) => {
    res.send('route1');
});

app.get('/api/history', (req, res) => {
    res.send('route2');
});

app.post('/login',
    passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true }));

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
