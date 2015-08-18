var express = require('express');
var fs = require('fs');
var NodeCache = require('node-cache');
var DataService = require('../services/data.js');
var router = express.Router();

var nodecache = new NodeCache({ 
    stdTTL: 100, 
    checkperiod: 120 
});

router.get('/nes', function(req, res, next) {
    
	var term = req.query.q;

	DataService.getFile('/data/nes.json', function(err, data) {
		if (err) {
			return res.json(err);
		}
		res.json(_searchmanifest(data, term, 'nes'));
	});
});

router.get('/snes', function(req, res, next) {
    
	var term = req.query.q;

	DataService.getFile('/data/snes.json', function(err, data) {
		if (err) {
			return res.json(err);
		}
		res.json(_searchmanifest(data, term, 'snes'));
	});
});

router.get('/all', function(req, res, next) {
    
	var term = req.query.q;

	DataService.getFile('/data/all.json', function(err, data) {
		if (err) {
			return res.json(err);
		}
		res.json(_searchmanifest(data, term));
	});
});

var _searchmanifest = function(manifest, term, system) {
	var result = [];
	var result2 = [];
	var regex_primary = new RegExp('^' + term, 'i');
	var regex_secondary = new RegExp(term, 'i');

	var primary = 0;
	var primarylimit = 20;
	var secondary = 0;

	for (game in manifest) {
		var pushed = false;
		if (game.match(regex_primary)) {
			pushed = result.push([game, manifest[game].playable, (system || manifest[game].system)]);
			++primary;
		}
		if (game.match(regex_secondary) && !pushed) {
			result2.push([game, manifest[game].playable, (system || manifest[game].system)]);
			++secondary;
		}
		if (primary === primarylimit) {
			break;
		}
	}

	if (result.length < primarylimit) {
		var space = primarylimit - (result.length - 1);
		for (var i = 0; i < space; ++i) {
			if (result2[i]) {
				result.push(result2[i]);
			}
		}
	}

	return result;
};

module.exports = router;