var express = require('express');
var fs = require('fs');
var async = require('async');
var router = express.Router();
var UtilitiesService = require('../services/utilities');

router.get('/nes', function(req, res, next) {

    var operation = req.query.op;

    UtilitiesService.buildData('nes', operation, function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(data);
    }, '\.nes$');
});

router.get('/snes', function(req, res, next) {

    var operation = req.query.op;

    UtilitiesService.buildData('snes', operation, function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(data);
    }, '\.smc$');
});

router.get('/gb', function(req, res, next) {

    var operation = req.query.op;

    UtilitiesService.buildData('gb', operation, function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(data);
    }, '\.gb$', '\.gbc$');
});

router.get('/gen', function(req, res, next) {

    var operation = req.query.op;

    UtilitiesService.buildData('gen', operation, function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(data);
    }, '\.bin$', '\.32x$');
});

router.get('/all', function(req, res, next) {

    var result = {};

    fs.readdir(__dirname + '/../public/roms/', function (err, systems) {
        if (err) {
            return res.json(err);
        }

        async.each(systems, function(system, nextsystem) {

            if (system.indexOf('.') === 0) {
                return nextsystem();
            }

            fs.readdir(__dirname + '/../public/roms/' + system, function (err, games) {
                if (err) {
                    return res.json(err);
                }

                async.each(games, function(game, nextgame) {

                    if (game.indexOf('.') === 0) {
                        return nextgame();
                    }

                    result[game] = {};

                    fs.readdir(__dirname + '/../public/roms/' + system + '/' + game, function (err, roms) {
                        if (err) {
                            return res.json(err);
                        }

                        var ext = '';
                        switch(system) {
                            case 'nes':
                                ext = '\.nes$';
                                break;
                            case 'snes':
                                ext = '\.smc$';
                                break;
                        }

                        var details = UtilitiesService.findBestPlayableGame(roms, ext); //returns index of playable game returns object with "game", "index" and "rank"

                        result[game] = {
                            g: details.game,
                            s: system
                        }

                        nextgame();
                    });


                }, function(err) {
                    if (err) {
                        return res.json(err);
                    }

                    nextsystem();
                });
            });
        }, function(err) {
            if (err) {
                return res.json(err);
            }

            res.json(result);
        });
    });
});

module.exports = router;
