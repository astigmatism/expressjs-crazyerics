var express = require('express');
var fs = require('fs');
var NodeCache = require('node-cache');
var DataService = require('../services/data.js');
var UtilitiesService = require('../services/utilities.js');
var router = express.Router();

var nodecache = new NodeCache({
    stdTTL: 100,
    checkperiod: 120
});

router.get('/nes', function(req, res, next) {

    var term = req.query.q || '';

    DataService.getFile('/data/nes/search.json', function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(UtilitiesService.search(data, term, 'nes'));
    });
});

router.get('/snes', function(req, res, next) {

    var term = req.query.q;

    DataService.getFile('/data/snes/search.json', function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(UtilitiesService.search(data, term, 'snes'));
    });
});

router.get('/gb', function(req, res, next) {

    var term = req.query.q;

	DataService.getFile('/data/gb/search.json', function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(UtilitiesService.search(data, term, 'gb'));
    });
});

router.get('/gen', function(req, res, next) {

    var term = req.query.q;

	DataService.getFile('/data/gen/search.json', function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(UtilitiesService.search(data, term, 'gen'));
    });
});

router.get('/all', function(req, res, next) {

    var term = req.query.q;

    DataService.getFile('/data/all/search.json', function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(UtilitiesService.search(data, term));
    });
});

module.exports = router;
