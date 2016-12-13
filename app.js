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

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const reactRouter = require('react-router');

const config = require('./config');
const db = require('./db');

require('node-jsx').install({
    harmony: true,
    extension: ".jsx"
});

const routes = require('./routes');

const MainComponent = React.createFactory(require('./components/MainComponent'));
const Routing = React.createFactory(reactRouter.RouterContext);

app.use(cookieParser());
app.use(bodyParser());

app.use(expressStatic(__dirname + '/views'));
app.use(session({ secret: 'secret12345' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.set('view engine', 'ejs');

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




app.get('*', (req, res, next) => {
    // res.sendFile(path.join(__dirname, '/views/index.html'));
    // let markup = ReactDOMServer.renderToString(MainComponent({ name: 'hello' }));
    // res.render("index", { markup: markup });
    reactRouter.match({ routes, location: req.url }, (error, redirectLocation, renderProps) => {
        if (error) {
            res.status(500).send(error.message);
        } else if (redirectLocation) {
            res.redirect(302, redirectLocation.pathname + redirectLocation.search);
        } else if (renderProps) {
            let markup = ReactDOMServer.renderToString(Routing(Object.assign({}, renderProps, { name: 'what up' })));
            res.status(200).render("index", { markup: markup });
        } else {
            next();
        }
    });
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

app.get('/api/polls', (req, res) => {
    res.json({ user: req.user, data: 'data5359' });
});
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}



db.connect(config.db.url, (err) => {
    if (err) {
        throw err;
        process.exit(1);
    } else {
        app.listen(config.port, () => {});
    }
});
