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
        suggestions = UtilitiesService.Compress.json(suggestions);
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
        suggestions = UtilitiesService.Compress.json(suggestions);
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
        suggestions = UtilitiesService.Compress.json(suggestions);
        res.json(suggestions);
    });
});

/*
recipe : {
    systems: [nes, snes, gen],  //null indicates all systems
    proportion: [40, 20, 40],   //percentage of system representation in total. null will use proportion of total of boxes for this system vs other systems
    sets: [0, 0, 0],             //enum: see below
    count: 100,                 //the number of results to return
}

recipe: {
    systems: {
        nes: {
            set: 0,
            proportion: 20
        }
    },
    count: 100
}

set:
0: use the "top suggestions" set only
1: use result from the "above system threshold" only. this usually means the boxart is us (not j or e)
2: use results from both above and below the system threshold. basically all boxart avaiable
3: use results from below the system threshold only. strange, but possible :)

*/
router.post('/', function(req, res, next) {

    var recipe = UtilitiesService.Decompress.json(req.body.recipe);

    SuggestionsService.Get(recipe, function(err, result) {
        if (err) {
            return res.json(err);
        }
        result = UtilitiesService.Compress.json(result);

        res.json(result);
    });
});

module.exports = router;
