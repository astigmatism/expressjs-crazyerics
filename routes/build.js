var express = require('express');
var fs = require('fs');
var async = require('async');
var router = express.Router();
var config = require('config');
var pako = require('pako');
var UtilitiesService = require('../services/utilities');

router.get('/data', function(req, res, next) {

    var aggrigation = {};
    var searchall   = {};
    var systems = config.get('systems');

    //loop over each system
    async.forEachOf(systems, function(systemdata, system, nextsystem) {

        UtilitiesService.buildData(system, function(err, result) {
            if (err) {
                return nextsystem(err);
            }

            aggrigation[system] = result;
            nextsystem();

        }, systemdata.romfileextentions);

    }, function(err) {
        if (err) {
            return res.json(err);
        }

        var allcount = 0;
        var totalsuggestions = 0;

        for (var system in aggrigation) {

            var titlecount = 0;
            var systemsuggestions = 0;

            for (var title in aggrigation[system]) {
                var bestfile = aggrigation[system][title].best;
                var bestrank = aggrigation[system][title].files[bestfile];

                if (bestrank >= config.get('search').suggestionThreshold) {
                    systemsuggestions++;
                    totalsuggestions++;
                }

                if (bestrank >= config.get('search').searchAllThreshold) {
                    searchall[title + '.' + system] = {
                        system: system,
                        file: bestfile,
                        rank: bestrank
                    };
                }
                ++titlecount;
                ++allcount;
            }

            console.log(system + ' title count: ' + titlecount + '. suggestions: ' + systemsuggestions + '. ratio: ' + systemsuggestions/4161);
        }

        console.log('total title count: ' + allcount + '. total suggestions: ' + totalsuggestions);

        var path = __dirname + '/../data/all.json';
        fs.writeFile(path, JSON.stringify(searchall), function(error) {
            if (err) {
                return res.json(err);
            }
            res.json('File ' + path + ' written');
        });
    });
});

router.get('/flatboxes/:system', function(req, res, next) {

    var system = req.params.system;
    var systemdir = __dirname + '/../public/images/flat/' + system;

    fs.readdir(systemdir, function(err, titles) {
        if (err) {
            return res.json(err);
        }

        //loop over titles
        async.eachSeries(titles, function(title, nexttitle) {

            var stats = fs.statSync(systemdir + '/' + title);
            if (stats.isFile()) {
                return nexttitle();
            }

            fs.readdir(systemdir + '/' + title, function(err, files) {
                if (err) {
                    return nexttitle(err);
                }

                var key = encodeURIComponent(UtilitiesService.compress.string(title));

                fs.rename(systemdir + '/' + title, systemdir + '/' + key, function(err) {
                    if (err) {
                        return nexttitle(err);
                    }

                    console.log(systemdir + '/' + title + ' --> ' + systemdir + '/' + key);

                    nexttitle();
                });
            });
        }, function(err, result) {
            if (err) {
                return res.json(err);
            }
            res.json(result);
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

router.get('/compressshaders/:name', function(req, res, next) {

    var path = __dirname + '/../public/shaderwork';
    var name = req.params.name;

    UtilitiesService.compressShaders(name, path, function(err, data) {
        if (err) {
            return res.json(err);
        }
        res.json(data);
    });

});

module.exports = router;
