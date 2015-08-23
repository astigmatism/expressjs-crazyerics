var express = require('express');
var fs = require('fs');
var async = require('async');
var router = express.Router();
var UtilitiesService = require('../services/utilities');

router.get('/nes', function(req, res, next) {

    var operation = req.query.op;

    UtilitiesService.buildData('nes', operation, function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(data);
    }, '\.nes$');
});

router.get('/snes', function(req, res, next) {

    var operation = req.query.op;

    UtilitiesService.buildData('snes', operation, function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(data);
    }, '\.smc$');
});

router.get('/gb', function(req, res, next) {

    var operation = req.query.op;

    UtilitiesService.buildData('gb', operation, function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(data);
    }, '\.gb$', '\.gbc$');
});

router.get('/gba', function(req, res, next) {

    var operation = req.query.op;

    UtilitiesService.buildData('gba', operation, function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(data);
    }, '\.gba$');
});

router.get('/gen', function(req, res, next) {

    var operation = req.query.op;

    UtilitiesService.buildData('gen', operation, function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(data);
    }, '\.bin$', '\.32x$');
});

router.get('/all', function(req, res, next) {

    result = {};

    //open the data dir
    fs.readdir(__dirname + '/../data', function(err, systems) {
        if (err) {
            return callback(err);
        }

        //loop over each system
        async.eachSeries(systems, function(system, nextsystem) {

            //pass over "all" folder
            if (system === 'all') {
                return nextsystem();
            }

            //read the genreated search.json file
            fs.readFile(__dirname + '/../data/' + system + '/search.json', 'utf8', function(err, content) {

                try {
                    content = JSON.parse(content);
                } catch (e) {
                    return res.json(e);
                }

                //add each game to the result, add a system property
                for (game in content) {
                    
                    var temp = content[game];
                    temp.s = system;
                    result[game] = temp;
                }
                
                return nextsystem();

            });

        }, function(err) {
            if (err) {
                res.json(err);
            }
            res.json(result);
        });
    });
});

module.exports = router;
