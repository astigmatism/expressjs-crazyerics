var express = require('express');
var jade = require('jade');
var UtilitiesService = require('../services/utilities.js');
var router = express.Router();

router.post('/:key/:slot', function(req, res, next) {
    
    var key = req.params.key;
    var slot = req.params.slot;
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

router.get('/:key', function(req, res, next) {

    var key = req.params.key;
    var game = UtilitiesService.decompress.json(key);
    key = UtilitiesService.compress.json(game);
    var states = {};

    if (req.session && req.session.games && req.session.games[key] && req.session.games[key].states) {
        states = req.session.games[key].states;
    }

    UtilitiesService.findGame(game.system, game.title, game.file, function(err, details) {
        if (err) {
            return res.json(err);
        }

        res.json({
            states: states,
            files: UtilitiesService.compress.json(details.files)
        });
    });
});

router.delete('/:key', function(req, res, next) {

    var key = req.params.key;

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