var express = require('express');
var fs = require('fs');
var async = require('async');
var router = express.Router();
var UtilitiesService = require('../services/utilities');

router.get('/nes', function(req, res, next) {

    async.series([
        function(callback){
            UtilitiesService.buildGames('nes', function(err, data) {
                if (err) {
                    return callback(err);
                }
                callback(null, data);
            }, '\.nes$');
        },
        function(callback){
            UtilitiesService.buildSearch('nes', function(err, data) {
                if (err) {
                    return callback(err);
                }
                callback(null, data);
            }, '\.nes$');
        }
    ], function(err, results) {
        if (err) {
            return res.json(err);
        }
        res.json(results);
    });
});

router.get('/snes', function(req, res, next) {

    async.series([
        function(callback){
            UtilitiesService.buildGames('snes', function(err, data) {
                if (err) {
                    return callback(err);
                }
                callback(null, data);
            }, '\.smc$');
        },
        function(callback){
            UtilitiesService.buildSearch('snes', function(err, data) {
                if (err) {
                    return callback(err);
                }
                callback(null, data);
            }, '\.smc$');
        }
    ], function(err, results) {
        if (err) {
            return res.json(err);
        }
        res.json(results);
    });
});

router.get('/gb', function(req, res, next) {

    async.series([
        function(callback){
            UtilitiesService.buildGames('gb', function(err, data) {
                if (err) {
                    return callback(err);
                }
                callback(null, data);
            }, '\.gb$', '\.gbc$');
        },
        function(callback){
            UtilitiesService.buildSearch('gb', function(err, data) {
                if (err) {
                    return callback(err);
                }
                callback(null, data);
            }, '\.gb$', '\.gbc$');
        }
    ], function(err, results) {
        if (err) {
            return res.json(err);
        }
        res.json(results);
    });
});

router.get('/gba', function(req, res, next) {

    async.series([
        function(callback){
            UtilitiesService.buildGames('gba', function(err, data) {
                if (err) {
                    return callback(err);
                }
                callback(null, data);
            }, '\.gba$');
        },
        function(callback){
            UtilitiesService.buildSearch('gba', function(err, data) {
                if (err) {
                    return callback(err);
                }
                callback(null, data);
            }, '\.gba$');
        }
    ], function(err, results) {
        if (err) {
            return res.json(err);
        }
        res.json(results);
    });
});

router.get('/gen', function(req, res, next) {

    async.series([
        function(callback){
            UtilitiesService.buildGames('gen', function(err, data) {
                if (err) {
                    return callback(err);
                }
                callback(null, data);
            }, '\.bin$', '\.32x$');
        },
        function(callback){
            UtilitiesService.buildSearch('gen', function(err, data) {
                if (err) {
                    return callback(err);
                }
                callback(null, data);
            }, '\.bin$', '\.32x$');
        }
    ], function(err, results) {
        if (err) {
            return res.json(err);
        }
        res.json(results);
    });
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
            fs.readFile(__dirname + '/../data/' + system + '/searchofficial.json', 'utf8', function(err, content) {

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
            var path = __dirname + '/../data/all/search.json';
            fs.writeFile(path, JSON.stringify(result), function(error) {
                if (err) {
                    return res.json(err);
                }
                res.json('File ' + path + ' written');
            });
        });
    });
});

module.exports = router;
