'use strict';
const express = require('express');
const app = express();
const path = require('path');

const config = require('./config');
const db = require('./db');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/search/:search', (req, res) => {
    res.send('route1');
});

app.get('/api/history', (req, res) => {
    res.send('route2');
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
