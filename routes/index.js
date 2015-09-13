var express = require('express');
var fs = require('fs');
var jade = require('jade');
var config = require('../config.js');
var async = require('async');
var UtilitiesService = require('../services/utilities.js');
var router = express.Router();

router.get('/', function(req, res, next) {
    
    UtilitiesService.collectDataFromClient(function(clientdata) {

        res.render('index', {
            layout: 'layout',
            retroarchconfig: clientdata.retroarchconfig,
            openonload: {}
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
        res.json(result);
    });
});

router.get('/suggest/all/:items', function(req, res, next) {

    var items = req.params.items;

    UtilitiesService.findSuggestionsAll(items, function(err, suggestions) {
        if (err) {
            return res.json(err);
        }
        res.json(suggestions);
    });
});

router.get('/suggest/:system/:items', function(req, res, next) {

    var system = req.params.system;
    var items = req.params.items || 10;

    if (config && config.data && config.data.systems && config.data.systems[system]) {

        UtilitiesService.findSuggestions(system, items, function(err, suggestions) {
            if (err) {
                return res.json(err);
            }
            res.json(suggestions);
        });
    } else {
        res.json(system + ' is not found the config and is not a valid system'); 
    }
});

router.get('/loadgame/:system/:folder/:file', function(req, res, next) {

    var system = req.params.system;
    var folder = req.params.folder;
    var file = req.params.file;

    UtilitiesService.loadGame(system, folder, file, function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.send(new Buffer(data, 'binary'));
    });
});

router.get('/emulator/:system', function(req, res, next) {
        
    var system = req.params.system;

    res.render('emulators/' + system);
});

router.get('/controls/:system', function(req, res, next) {
    
    var system = req.params.system;
    res.render('controls/' + system);
});

router.get('/test/controls/:system', function(req, res, next) {
    
    var system = req.params.system;
    res.render('controls/' + system, {
        layout: 'basic'
    });
});

//this route defined last to avoid overriding any route above
router.get('/:system/:game', function(req, res, next) {
    
    var system = req.params.system;
    var game = req.params.game;
    var openonload = {};

    UtilitiesService.collectDataFromClient(function(clientdata) {
        UtilitiesService.findGame(system, game, function(err, result) {
            if (result) {
                openonload = result;
            }
            res.render('index', {
                layout: 'layout',
                retroarchconfig: clientdata.retroarchconfig,
                openonload: openonload
            });
        });
    });
});

module.exports = router;
