var express = require('express');
var jade = require('jade');
var config = require('../config.js');
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

router.get('/suggest/all/:items', function(req, res, next) {

    var items = req.params.items;

    UtilitiesService.findSuggestionsAll(items, function(err, suggestions) {
        if (err) {
            return res.json(err);
        }
        var compressed = UtilitiesService.compress.json(suggestions);
        res.json(compressed);
    });
});

router.get('/suggest/:system/:items', function(req, res, next) {

    var system = req.params.system;
    var items = req.params.items || 10;

    UtilitiesService.findSuggestions(system, items, function(err, suggestions) {
        if (err) {
            return res.json(err);
        }
        var compressed = UtilitiesService.compress.json(suggestions);
        res.json(compressed);
    });
});

//ajax call to load a game
router.get('/load/:system/:title/:file', function(req, res, next) {

    var system = req.params.system;
    var title = req.params.title;
    var file = req.params.file;

    UtilitiesService.loadGame(system, title, file, function(err, content) {
        if (err) {
            return res.json(err);
        }

        UtilitiesService.setPlayHistory(req, system, title, file, true, function(err, ph) {
            if (err) {
                return res.json(err);
            }
            res.send(content);
        });
    });
});

//direct link to game, usually rerouted from compressed url, maybe a bookmark
router.get('/start/:system/:title/:file', function(req, res, next) {
    
    var system = req.params.system;
    var title = req.params.title;
    var file = req.params.file;
    var openonload = {};

    UtilitiesService.collectDataForClient(req, {
        system: system,
        title: title,
        file: file
    }, function(err, clientdata) {        
        if (err) {
            return res.json(err);
        }

        UtilitiesService.setPlayHistory(req, system, title, file, true, function(err, ph) {
            if (err) {
                return res.json(err);
            }
            
            res.render('index', {
                layout: 'layout',
                clientdata: clientdata
            });
        });
    });
});

router.get('/load/emulator/:system', function(req, res, next) {
        
    var system = req.params.system;

    res.render('emulators/' + system);
});

router.get('/layout/controls/:system', function(req, res, next) {
    
    var system = req.params.system;
    res.render('controls/' + system);
});

router.get('/:wildcard', function(req, res, next) {

    var wildcard = req.params.wildcard;
    var route = pako.inflate(atob(wildcard), { to: 'string' });
    return res.redirect(route);
});

module.exports = router;
