var express = require('express');
var UtilitiesService = require('../services/utilities.js');
var pako = require('pako');
var atob = require('atob');
var router = express.Router();
var config = require('config');

router.get('/', function(req, res, next) {

    //get general client config data
    UtilitiesService.collectConfigDataForClient(req, function(err, clientconfig) {
        if (err) {
            return res.json(err);
        }

        //now get player specific data
        UtilitiesService.collectPlayerDataForClient(req, null, function(err, playerdata) {
            if (err) {
                return res.json(err);
            }

            res.render('index', {
                layout: 'layout',
                playerdata: playerdata, //player perferences, can handled dynamically in client
                clientconfig: clientconfig, //client-needed configuration values, static in nature
                assetpath: config.get('assetpath') //defined outside of client data because it is used in layout
            });
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

    res.render('emulators/' + system, {
        assetpath: config.get('assetpath')
    });
});

//at the same time we load the game's data file (locally or CDN) we run to the server to
//let it know a game was loaded and respond with states
router.get('/load/game', function(req, res, next) {

    var key = decodeURIComponent(req.query.key); //key has been uriencoded, compressed and base64 encoded
    var shader = req.query.shader; //if we are to load a shader definition with this game, it was passed here
    var game = UtilitiesService.decompress.json(key); //extract values
    var states = {};

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

        //get states used by this game
        if (req.session.games[key] && req.session.games[key].states) {
            states = req.session.games[key].states;
        }

        //also return the game files used by this title (for selecting a different file to load)
        UtilitiesService.findGame(game.system, game.title, game.file, function(err, details) {
            if (err) {
                return res.json(err);
            }

            var result = {
                states: states,
                files: details.files
            };

            //do we also want to load a shader definition? if no shader defined, comes back as empty string
            UtilitiesService.getShader(shader, function(err, shaderdata) {
                //no error handling here!
                //in the case of an error, just return without shader info
                if (shaderdata) {
                    result.shader = shaderdata;
                }

                res.json(UtilitiesService.compress.json(result));
            });
        });
    }
});

router.get('/layout/controls/:system', function(req, res, next) {

    var system = req.params.system;
    res.render('controls/' + system);
});

module.exports = router;
