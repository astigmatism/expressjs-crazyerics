var express = require('express');
var router = express.Router();
var config = require('config');
var UtilitiesService = require('../services/utilities.js');
var SuggestionsService = require('../services/suggestions.js');

router.get('/all/:items', function(req, res, next) {

    var items = req.params.items;
    
    SuggestionsService.findSuggestionsAll(items, function(err, suggestions) {
        if (err) {
            return res.json(err);
        }
        suggestions = UtilitiesService.compress.json(suggestions);
        res.json(suggestions);
    });
});

router.get('/browse/:system', function(req, res, next) {

    var system = req.params.system;
    var term = req.query.term;

    SuggestionsService.browse(system, term, function(err, suggestions) {
        if (err) {
            return res.json(err);
        }
        suggestions = UtilitiesService.compress.json(suggestions);
        res.json(suggestions);
    });
});

router.get('/:system/:items', function(req, res, next) {

    var system = req.params.system;
    var items = req.params.items || 10;
    var foreignMixPerc = config.get('search').foreignMixPerc;

    SuggestionsService.findSuggestions(system, items, foreignMixPerc, function(err, suggestions) {
        if (err) {
            return res.json(err);
        }
        suggestions = UtilitiesService.compress.json(suggestions);
        res.json(suggestions);
    });
});

module.exports = router;
