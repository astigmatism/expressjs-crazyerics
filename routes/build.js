var express = require('express');
var fs = require('fs');
var async = require('async');
var router = express.Router();
var config = require('../config.js');
var pako = require('pako');
var UtilitiesService = require('../services/utilities');

router.get('/data', function(req, res, next) {

    var aggrigation = {};
    var searchall   = {};

    if (config && config.data && config.data.systems) {

        //loop over each system
        async.forEachOf(config.data.systems, function(systemdata, system, nextsystem) {

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

            for (var system in aggrigation) {
                for (var title in aggrigation[system]) {
                    var bestfile = aggrigation[system][title].best;
                    var bestrank = aggrigation[system][title].files[bestfile];

                    if (bestrank >= config.data.search.searchAllThreshold) {
                        searchall[title + '.' + system] = {
                            system: system,
                            file: bestfile,
                            rank: bestrank
                        };
                    }
                }
            }

            var path = __dirname + '/../data/all.json';
            fs.writeFile(path, JSON.stringify(searchall), function(error) {
                if (err) {
                    return res.json(err);
                }
                res.json('File ' + path + ' written');
            });
        });

    } else {
        return res.json(system + ' is not found the config and is not a valid system');
    }
});

router.get('/zip/:system', function(req, res, next) {

    var system = req.params.system;

    fs.readdir(__dirname + '/../public/roms/' + system, function(err, titles) {
        if (err) {
            return res.json(err);
        }

        fs.mkdir(__dirname + '/../public/zipped/' + system, function(err) {
            if (err) {
                return res.json(err);
            }

            //loop over titles
            async.eachSeries(titles, function(title, nexttitle) {

                var stats = fs.statSync(__dirname + '/../public/roms/' + system + '/' + title);
                if (stats.isFile()) {
                    return nexttitle();
                }

                fs.readdir(__dirname + '/../public/roms/' + system + '/' + title, function(err, files) {
                    if (err) {
                        return nexttitle(err);
                    }

                    fs.mkdir(__dirname + '/../public/zipped/' + system + '/' + title, function(err) {
                        if (err) {
                            return nexttitle(err);
                        }

                        //loop over files
                        async.eachSeries(files, function(file, nextfile) {

                            fs.readFile(__dirname + '/../public/roms/' + system + '/' + title + '/' + file, function(err, buffer) {
                                if (err) {
                                    return nextfile(err);
                                }

                                //convert buffer to uint8array
                                var ab = new ArrayBuffer(buffer.length);
                                var view = new Uint8Array(ab);
                                for (var i = 0; i < buffer.length; ++i) {
                                    view[i] = buffer[i];
                                }
                                var deflated = pako.deflate(view, {to: 'string'});

                                fs.writeFile(__dirname + '/../public/zipped/' + system + '/' + title + '/' + file, deflated, function(err) {
                                    if (err) {
                                        return nextfile(err);
                                    }

                                    console.log(file + ' --> ' + buffer.length + ' --> ' + deflated.length);
                                    nextfile();
                                });
                            });

                        }, function(err, result) {
                            if (err) {
                                return res.json(err);
                            }
                            nexttitle();
                        });
                    });
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

module.exports = router;
