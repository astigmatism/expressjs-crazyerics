'use strict';
const express = require('express');
const router = express.Router();
const config = require('config');
const fs = require('fs');
const SaveService = require('../services/saves');
const GameService = require('../services/games');
const ApplicationService = require('../services/application');
const SearchService = require('../services/search');
const UtilitiesService = require('../services/utilities')

router.get('/', function(req, res, next) {

    //req.user will not be available here for instances where a new session (and new user) are inserted because they happen asynconously
    //never attempt to use req.user in this route!

    //get general client config data
    ApplicationService.ApplicationEntry(req, function(err, data) {
        if (err) return next(err);

        var compressed = UtilitiesService.Compress.json(data);

        res.render('index', {
            layout: 'layout',
            data: compressed, //all data client needs. config and player data,
            imagepath: data.config.paths.images
        });
    });
});

router.get('/search/:system/:query', function(req, res, next) {

    var system = req.params.system;
    var term = req.params.query || '';

    SearchService.Search(system, term, null, function(err, result) {
        if (err) return next(err);
        
        var compressed = UtilitiesService.Compress.json(result);
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
                imagepath: config.get('imagepath'),
                emupath: config.get('emupath'),
                emufile: config.get('systems.' + system + '.emufile')
            });
            return;
        }   

        //otherwise, render the common emulator layout
        res.render('emulator', {
            imagepath: config.get('imagepath'),
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
