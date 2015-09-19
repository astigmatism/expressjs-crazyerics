var express = require('express');
var fs = require('fs');
var jade = require('jade');
var config = require('../config.js');
var async = require('async');
var UtilitiesService = require('../services/utilities.js');
var router = express.Router();

router.get('/', function(req, res, next) {
    
    UtilitiesService.collectDataForClient(req, null, function(clientdata) {

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

    if (config && config.data && config.data.systems && config.data.systems[system]) {

        UtilitiesService.findSuggestions(system, items, function(err, suggestions) {
            if (err) {
                return res.json(err);
            }
            var compressed = UtilitiesService.compress.json(suggestions);
            res.json(compressed);
        });
    } else {
        res.json(system + ' is not found the config and is not a valid system'); 
    }
});

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

router.get('/load/emulator/:system', function(req, res, next) {
        
    var system = req.params.system;

    res.render('emulators/' + system);
});

//this one last as two wild cards follow load
router.get('/load/:system/:title', function(req, res, next) {
    
    var system = req.params.system;
    var title = req.params.title;
    var openonload = {};

    UtilitiesService.collectDataForClient(req, {
        system: system,
        title: title
    }, function(clientdata) {        

        res.render('index', {
            layout: 'layout',
            clientdata: clientdata
        });
    });
});

router.post('/states/:system/:title/:file/:slot', function(req, res, next) {
    
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

router.get('/states/:system/:title/:file', function(req, res, next) {

    var system = req.params.system;
    var title = req.params.title;
    var file = req.params.file;

    var states = {};

    if (req.session && req.session.games && req.session.games[system] && req.session.games[system][title] && req.session.games[system][title][file] && req.session.games[system][title][file].states) {
        states = req.session.games[system][title][file].states;
    }

    UtilitiesService.findGame(system, title, function(err, details) {
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
        return res.json();
    });
});

router.get('/layout/controls/:system', function(req, res, next) {
    
    var system = req.params.system;
    res.render('controls/' + system);
});

module.exports = router;
