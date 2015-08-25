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
    var result = {};
    var systems = Object.keys(config.data.systems);

    async.each(systems, function(system, nextsystem) {

        UtilitiesService.findSuggestions(system, items, function(err, suggestions) {
            if (err) {
                return nextsystem(err);
            }
            result[system] = suggestions;
            nextsystem();
        });

    }, function(err) {
        if (err) {
            return res.json(err);
        }
        res.json(result);
    });
});

router.get('/suggest/:system/:items', function(req, res, next) {

    var system = req.params.system;
    var items = req.params.items || 10;

    UtilitiesService.findSuggestions(system, items, function(err, suggestions) {
        if (err) {
            return res.json(err);
        }
        res.json(suggestions);    
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
