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
		
		var result = [];
		var regex = new RegExp('^' + term, 'i');

		for (game in data) {
			if (regex.test(game)) {
				result.push([game, data[game].playable]);
			}
		}
		res.json(result);
	});
});

module.exports = router;