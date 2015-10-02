var express = require('express');
var jade = require('jade');
var UtilitiesService = require('../services/utilities.js');
var router = express.Router();

router.post('/save', function(req, res, next) {
    
    var key = decodeURIComponent(req.query.key);
    var slot = req.query.slot;
    var data = req.body;

    if (req.session) {
        req.session.games = req.session.games ? req.session.games : {};
        req.session.games[key] = req.session.games[key] ? req.session.games[key] : {};
        req.session.games[key].states = req.session.games[key].states ? req.session.games[key].states : {};
        req.session.games[key].states[slot] = data;

        //save state time in play history
        if (req.session.games.history && req.session.games.history[key]) {
            req.session.games.history[key].slots[slot] = Date.now();
        }

    }
    res.json();
});

router.delete('/delete', function(req, res, next) {

    var key = decodeURIComponent(req.query.key);

    if (req.session) {
        if (req.session.games && req.session.games[key] && req.session.games[key]) {
             delete req.session.games[key];
        }

        if (req.session.games.history && req.session.games.history[key]) {
            delete req.session.games.history[key]
        }
    }
    res.json();
    
});

module.exports = router;