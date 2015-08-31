var express = require('express');
var fs = require('fs');
var jade = require('jade');
var config = require('../config.js');
var async = require('async');
var UtilitiesService = require('../services/utilities.js');
var router = express.Router();

router.get('/', function(req, res, next) {
    
    res.render('index', {
        layout: 'layout'
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

router.get('/build/:system', function(req, res, next) {

    var system = req.params.system;

    if (config && config.data && config.data.systems && config.data.systems[system]) {

        var systemconfig = config.data.systems[system];
        
        async.series([
            function(callback){
                UtilitiesService.buildGames(system, function(err, data) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, data);
                }, systemconfig.romfileextentions);
            },
            function(callback){
                UtilitiesService.buildSearch(system, function(err, data) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, data);
                }, systemconfig.romfileextentions);
            }
        ], function(err, results) {
            if (err) {
                return res.json(err);
            }
            res.json(results);
        });
    } else {
        res.json(system + ' is not found the config and is not a valid system');
    }
});

router.get('/folders/:system', function(req, res, next) {

    var system = req.params.system;
        
    UtilitiesService.buildRomFolders(system, function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(null, data);
    });
});


router.get('/loademulator', function(req, res, next) {

	var emulator = req.query.emulator;
	var title = req.query.title;

	fs.readFile(__dirname + '/../views/emulators/' + emulator + '.jade', 'utf8', function (err, data) {
        if (err) {
        	console.log(err);
        	return res.send();
        }
        var fn = jade.compile(data);
        var html = fn({
        	title: title
        });
        res.send(html);
    });
});

module.exports = router;
