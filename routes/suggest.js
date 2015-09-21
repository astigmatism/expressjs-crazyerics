var express = require('express');
var router = express.Router();
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

    UtilitiesService.findSuggestions(system, items, function(err, suggestions) {
        if (err) {
            return res.json(err);
        }
        var compressed = UtilitiesService.compress.json(suggestions);
        res.json(compressed);
    });
});

module.exports = router;
