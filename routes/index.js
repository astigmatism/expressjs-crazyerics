var express = require('express');
var router = express.Router();
var config = require('config');
var fs = require('fs');
var SaveService = require('../services/saveservice.js');
var GameService = require('../services/gameservice.js');
var UtilitiesService = require('../services/utilities.js');
var SearchService = require('../services/search.js');

router.get('/', function(req, res, next) {

    //get general client config data
    UtilitiesService.collectDataForClient(req, null, function(err, clientdata) {
        if (err) {
            return res.json(err);
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

    SearchService.search(system, term, null, function(err, result) {
        if (err) {
            return res.json(err);
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
