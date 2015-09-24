var express = require('express');
var UtilitiesService = require('../services/utilities.js');
var pako = require('pako');
var atob = require('atob');
var router = express.Router();

router.get('/', function(req, res, next) {

    UtilitiesService.collectDataForClient(req, null, function(err, clientdata) {
        if (err) {
            return res.json(err);
        }
        res.render('index', {
            layout: 'layout',
            clientdata: clientdata
        });
    });
});

router.get('/search/:system/:query', function(req, res, next) {

    var system = req.params.system;
    var term = req.params.query || '';

    UtilitiesService.search(system, term, null, function(err, result) {
        if (err) {
            return res.json(err);
        }
        var compressed = UtilitiesService.compress.json(result);
        res.json(compressed);
    });
});

router.get('/load/emulator/:system', function(req, res, next) {

    var system = req.params.system;

    res.render('emulators/' + system);
});

router.get('/load/game', function(req, res, next) {

    var key = decodeURIComponent(req.query.key); //key has been uriencoded, compressed and base64 encoded
    var game = UtilitiesService.decompress.json(key); //extract values

    //decompressed key contains these members
    if (game.system && game.title && game.file) {

        UtilitiesService.loadGame(game.system, game.title, game.file, function(err, content) {
            if (err) {
                return res.json(err);
            }

            if (req.session) {
                req.session.games = req.session.games ? req.session.games : {};
                req.session.games.history = req.session.games.history ? req.session.games.history : {};

                //this is override the same key (game) with more recent data
                if (key in req.session.games.history) {

                } else {
                    req.session.games.history[key] = {
                        system: game.system,
                        title: game.title,
                        file: game.file,
                        slots: {}
                    }
                }
                req.session.games.history[key].played = Date.now();
            }

            res.send(content);
        });
    } else {
        res.json(game);
    }
});

router.get('/layout/controls/:system', function(req, res, next) {

    var system = req.params.system;
    res.render('controls/' + system);
});

module.exports = router;
