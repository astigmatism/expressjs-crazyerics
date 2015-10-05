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

                if (bestrank >= config.data.search.suggestionThreshold) {
                    systemsuggestions++;
                    totalsuggestions++;
                }

                if (bestrank >= config.data.search.searchAllThreshold) {
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

router.get('/flatten/:system', function(req, res, next) {

    var system = req.params.system;

    fs.readdir(__dirname + '/../public/roms/' + system, function(err, titles) {
        if (err) {
            return res.json(err);
        }

        fs.mkdir(__dirname + '/../public/flattened/' + system, function(err) {
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

                    //loop over files
                    async.eachSeries(files, function(file, nextfile) {

                        fs.readFile(__dirname + '/../public/roms/' + system + '/' + title + '/' + file, function(err, data) {
                            if (err) {
                                return nextfile(err);
                            }

                            var key = UtilitiesService.compress.json({
                                "0": title,
                                "1": file
                            });

                            fs.writeFile(__dirname + '/../public/flattened/' + system + '/' + encodeURIComponent(key), data, function(err) {
                                if (err) {
                                    return nextfile(err);
                                }

                                console.log(system + '/' + file + ' --> ' + system + '/' + key);
                                
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
        }, function(err, result) {
            if (err) {
                return res.json(err);
            }
            res.json(result);
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

module.exports = router;
