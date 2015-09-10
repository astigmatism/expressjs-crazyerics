var express = require('express');
var fs = require('fs');
var async = require('async');
var router = express.Router();
var config = require('../config.js');
var UtilitiesService = require('../services/utilities');

router.get('/data', function(req, res, next) {

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

            var gamecount = 0;
            var gamecountsuggestions = 0;

            if (config && config.data && config.data.systems && config.data.systems[system]) {

                var systemconfig = config.data.systems[system];

                async.series([
                    function(systemcallback){
                        UtilitiesService.buildGames(system, function(err, data) {
                            if (err) {
                                return systemcallback(err);
                            }
                            systemcallback(null, data);
                        }, systemconfig.romfileextentions);
                    },
                    function(systemcallback){
                        UtilitiesService.buildSearch(system, function(err, data) {
                            if (err) {
                                return systemcallback(err);
                            }
                            systemcallback(null, data);
                        }, systemconfig.romfileextentions);
                    }
                ], function(err, results) {
                    if (err) {
                        return callback(err);
                    }
                    console.log(results);
                    

                    //read the genreated search.json file
                    fs.readFile(__dirname + '/../data/' + system + '/search.json', 'utf8', function(err, content) {

                        try {
                            content = JSON.parse(content);
                        } catch (e) {
                            return res.json(e);
                        }

                        //add each game to the result, add a system property
                        for (game in content) {

                            var item = content[game];
                            gamecount++;
                            
                            //if above the threshhold
                            if (item.r >= config.data.search.suggestionThreshold) {
                                item.s = system;
                                result[game + '.' + system] = item;
                                gamecountsuggestions++;
                            }
                        }

                        console.log('total number of ' + system + ' games: ' + gamecount + '. games above suggestions threshold: ' + gamecountsuggestions);
                        
                        return nextsystem();

                    });
                });

            } else {
                return callback(system + ' is not found the config and is not a valid system');
            }
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

router.get('/folders/:system', function(req, res, next) {

    var system = req.params.system;
        
    UtilitiesService.buildRomFolders(system, function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(data);
    });
});

module.exports = router;
