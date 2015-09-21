var express = require('express');
var jade = require('jade');
var UtilitiesService = require('../services/utilities.js');
var router = express.Router();

router.post('/:system/:title/:file/:slot', function(req, res, next) {
    
    var system = req.params.system;
    var title = req.params.title;
    var file = req.params.file;
    var slot = req.params.slot;
    var data = req.body;

    if (req.session) {
        req.session.games = req.session.games ? req.session.games : {};
        req.session.games[system] = req.session.games[system] ? req.session.games[system] : {};
        req.session.games[system][title] = req.session.games[system][title] ? req.session.games[system][title] : {};
        req.session.games[system][title][file] = req.session.games[system][title][file] ? req.session.games[system][title][file] : {};
        req.session.games[system][title][file].states = req.session.games[system][title][file].states ? req.session.games[system][title][file].states : {};
        req.session.games[system][title][file].states[slot] = data;
    }
    res.json();
});

router.get('/:system/:title/:file', function(req, res, next) {

    var system = req.params.system;
    var title = req.params.title;
    var file = req.params.file;

    var states = {};

    if (req.session && req.session.games && req.session.games[system] && req.session.games[system][title] && req.session.games[system][title][file] && req.session.games[system][title][file].states) {
        states = req.session.games[system][title][file].states;
    }

    UtilitiesService.findGame(system, title, file, function(err, details) {
        if (err) {
            return res.json(err);
        }

        res.json({
            states: states,
            files: UtilitiesService.compress.json(details.files)
        });
    });
});

router.delete('/:system/:title/:file', function(req, res, next) {

    var system = req.params.system;
    var title = req.params.title;
    var file = req.params.file;

    UtilitiesService.setPlayHistory(req, system, title, file, false, function(err, ph) {
        if (err) {
            return res.json(err);
        }
        if (req.session && req.session.games && req.session.games[system] && req.session.games[system][title] && req.session.games[system][title][file]) {
            delete req.session.games[system][title][file];
        }
        res.json();
    });
});

module.exports = router;