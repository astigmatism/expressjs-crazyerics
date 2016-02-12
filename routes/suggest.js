var express = require('express');
var router = express.Router();
var config = require('config');
var UtilitiesService = require('../services/utilities.js');

router.get('/all/:items', function(req, res, next) {

    var items = req.params.items;
    
    UtilitiesService.findSuggestionsAll(items, function(err, suggestions) {
        if (err) {
            return res.json(err);
        }
        var compressed = UtilitiesService.compress.json(suggestions);
        res.json(compressed);
    });
});

router.get('/:system/:items', function(req, res, next) {

    var system = req.params.system;
    var items = req.params.items || 10;
    var foreignMixPerc = config.get('search').foreignMixPerc;

    UtilitiesService.findSuggestions(system, items, foreignMixPerc, function(err, suggestions) {
        if (err) {
            return res.json(err);
        }
        var compressed = UtilitiesService.compress.json(suggestions);
        res.json(compressed);
    });
});

module.exports = router;
