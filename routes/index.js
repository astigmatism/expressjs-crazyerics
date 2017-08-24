var express = require('express');
var router = express.Router();
var config = require('config');
var fs = require('fs');
var SaveService = require('../services/saves.js');
var GameService = require('../services/games.js');
var ApplicationService = require('../services/application.js');
var SearchService = require('../services/search.js');

router.get('/', function(req, res, next) {

    //req.user will not be available here for instances where a new session (and new user) are inserted because they happen asynconously
    //never attempt to use req.user in this route!

    //get general client config data
    ApplicationService.ApplicationEntry(req, function(err, clientdata) {
        if (err) {
            return next(err);
        }

        res.render('index', {
            layout: 'layout',
            clientdata: clientdata, //all data client needs. config and player data
            assetpath: config.get('assetpath') //defined outside of client data because it is used in layout
        });
    });
});

router.get('/search/:system/:query', function(req, res, next) {

    var system = req.params.system;
    var term = req.params.query || '';

    SearchService.Search(system, term, null, function(err, result) {
        if (err) {
            return next(err);
        }
        var compressed = UtilitiesService.compress.json(result);
        res.json(compressed);
    });
});

//this is the call to load the emulator's view into an iframe
router.get('/load/emulator/:system', function(req, res, next) {

    var system = req.params.system;

    //check for the existance of a customized layout for this system
    fs.exists(__dirname + '/../views/emulators/' + system + '.pug', function(exists) {

        if (exists) {

            res.render('emulators/' + system, {
                assetpath: config.get('assetpath'),
                emupath: config.get('emupath'),
                emufile: config.get('systems.' + system + '.emufile')
            });
            return;
        }   

        //otherwise, render the common emulator layout
        res.render('emulator', {
            assetpath: config.get('assetpath'),
            emupath: config.get('emupath'),
            emufile: config.get('systems.' + system + '.emufile')
        });
    });
});

router.get('/layout/controls/:system', function(req, res, next) {

    var system = req.params.system;
    res.render('controls/' + system);
});

module.exports = router;
