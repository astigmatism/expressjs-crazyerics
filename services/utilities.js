
var fs = require('fs');
var async = require('async');
var config = require('config');
var pako = require('pako');
var btoa = require('btoa');
var atob = require('atob');
var merge = require('merge');
var FileService = require('../services/fileservice.js');

/**
 * UtilitiesService Constructor
 */
UtilitiesService = function() {
};

/**
 * This runs on application start. The goal here is to mainly cache freqently accessed data.
 * @param  {Function} callback
 * @return {undef}
 */
UtilitiesService.onApplicationStart = function(callback) {

    //put into cache all the data files
    var systems = config.get('systems');
    var search = {};
    
    //when suggesting titles for all consoles we'll use this object, 
    //it's structure considers system to evenly suggest titles by system
    //the keys will be systems (except for data which I use for other things)
    var suggestionsall = {
        'data': {
            'alltitlecount': 0,
            'allsuggestioncount': 0
        }
    }; 
    

    async.each(Object.keys(systems), function(system, nextsystem) {

        if (config.has('systems.' + system + '.live') && !config.get('systems.' + system + '.live')) {
            console.log(system + ' is not live, skipping caching');
            return nextsystem();
        }

        //ok, lets open the data file
        FileService.getFile('/data/' + system + '.json', function(err, data) {
            if (err) {
                console.log('Could not find data file for ' + system + ' even though they are defined in config');
                return nextsystem();
            }

            //let's cache files in this section
            FileService.getFile('/data/' + system + '_thegamesdb.json', function(err, thegamesdb) {
                if (err) {
                    console.log('Could not find thegamesdb file for ' + system + '.');
                }
            

                //let's try opening the boxart data file now too
                FileService.getFile('/data/' + system + '_boxart.json', function(err, boxartdata) {
                    if (err) {
                        console.log('Could not find boxart file for ' + system + '. No suggests can be made without boxart');
                        //if error, console log only, we can still build cache
                    }

                    //we'll cache a separate structure for each system (to avoid using the heavier all suggestions cache)
                    var suggestions = {
                        'top': [],      //top suggestions are those that have been marked in the box datafile as the most "inviting" titles for the system (my discretion!)
                        'best': [],     //best system suggestions will show alongside other system suggestions
                        'foreign': [],  //remaining suggestions will be included here
                        'data': {}
                    };

                    //add new key for this system to all suggestions
                    suggestionsall[system] = {
                        'top': [],
                        'best': [],
                        'data': {}
                    };

                    var systemSuggestionThreshold = config.has('systems.' + system + '.suggestionThreshold') ? config.get('systems.' + system + '.suggestionThreshold') : config.get('search').suggestionThreshold;
                    var titlesWithRating = 0;

                    //ok, let's build the all.json file with the data from each file
                    for (var title in data) {

                        var bestfile = data[title].best;
                        var bestrank = data[title].files[bestfile];

                        //in order to be suggested must have art and must need minimum rank to be preferable playing game
                        //you can get systemSuggestionThreshold in config if needed
                        if (boxartdata && title in boxartdata) {

                            //include thegamesdb rating info into suggestions cache
                            if (thegamesdb && thegamesdb[title] && thegamesdb[title].Rating) {
                                data[title].thegamesdbrating = thegamesdb[title].Rating;
                                ++titlesWithRating;
                            }

                            //top suggestions. these titles can also exist in "best" and "foriegn" so be sure not to mix them
                            if (boxartdata[title].hasOwnProperty('ts')) {

                                //add to all suggestions
                                suggestionsall[system].top.push(title);
                                suggestionsall[system].data[title] = data[title];

                                //add to system suggestions
                                suggestions.top.push(title);
                                suggestions.data[title] = data[title];
                            }
                            
                            //ok, now separate the remianing boxart titles between above the threshold and below it
                            if (bestrank >= systemSuggestionThreshold) {
                                
                                //add to all suggestions
                                suggestionsall[system].best.push(title);
                                suggestionsall[system].data[title] = data[title];   

                                //increase counter
                                ++suggestionsall.data.allsuggestioncount;

                                //add to system suggestions
                                suggestions.best.push(title);
                                suggestions.data[title] = data[title];

                            } else {
                                
                                //foreign suggestion (has art but doesn't meet the suggestion threshold for system)
                                
                                //add to system suggestions
                                suggestions.foreign.push(title);
                                suggestions.data[title] = data[title];
                            }
                        }

                        //if the rank of the best playable file for the title is above the threshold for part of all-console search
                        if (bestrank >= config.get('search').searchAllThreshold) {
                            search[title + '.' + system] = {
                                system: system,
                                file: bestfile,
                                rank: bestrank
                            };
                        }
                        
                        //increase counter
                        ++suggestionsall.data.alltitlecount;
                    }

                    //cache suggestions for this system
                    FileService.setCache('suggestions.' + system, suggestions); //ok to be sync

                    console.log('suggestions.' + system + ' (threshold: ' + systemSuggestionThreshold + ') "inviting" suggestions --> ' + suggestions.top.length + '. suggestions above threshold --> ' + suggestions.best.length + '. suggestions below threshhold --> ' + suggestions.foreign.length + '. total with thegamesdb rating --> ' + titlesWithRating);

                    nextsystem();
                });
            });
        });

    }, function(err) {
        if (err) {
            return callback(err);
        }

        FileService.wholescaleSetCache({
            'suggestions.all': suggestionsall,
            '/data/all.json': search
        }, 0, function(err) {
            if (err) {
                return callback(err);
            }
            callback();
        });
    });
};

//this function returns all details given a system and a title. must be exact matches to datafile!
//also returns hasboxart flag and any info (ripped from thegamesdb)
UtilitiesService.findGame = function(system, title, file, callback) {

    //I found it faster to save all the results in a cache rather than load all the caches to create the result.
    //went from 120ms response to about 30ms
    FileService.getCache(system + title + file, function(err, data) {
        if (err) {
            return callback(err);
        }

        //if already returned, use cache
        if (data) {
            return callback(null, data);
        }

        var data = {
            system: null,
            title: null,
            file: null,
            files: null,
            boxart: null,
            info: null
        };

        //open data file for details
        FileService.getFile('/data/' + system + '.json', function(err, games) {
            if (err) {
                return callback(err);
            }

            //if title found in datafile.. we can find data anywhere since all data is constructed from the original datafile!
            if (games[title] && games[title].files[file]) {

                data.system = system;
                data.title = title;
                data.file = file;
                data.files = games[title].files;

                //is there box art too?
                FileService.getFile('/data/' + system + '_boxart.json', function(err, boxartgames) {
                    if (err) {
                        //no need to trap here
                    } else {

                        if (boxartgames[title]) {
                            data.boxart = boxartgames[title];
                        }
                    }

                    //is there info?
                    FileService.getFile('/data/' + system + '_thegamesdb.json', function(err, thegamesdb) {
                        if (err) {
                            //no need to trap here
                        } else {

                            if (thegamesdb[title]) {
                                data.info = thegamesdb[title];
                            }
                        }

                        FileService.setCache(system + title + file, data);

                        return callback(null, data);
                    });
                });

            } else {
                return callback(title + ' not found for ' + system + ' or ' + file + ' not found in ' + title);
            }
        });

    });
};

UtilitiesService.collectDataForClient = function(req, openonload, callback) {

    var playerdata = {};
    var configdata = {};
    

    //system details
    var systems = config.get('systems');

    configdata['systemdetails'] = {};

    //system specific configs
    for (system in systems) {
        
        //if system is "live" (ready to show for production)
        if (systems[system].live) {


            //a white list of config settings available to client:

            //required
            configdata.systemdetails[system] = {
                'name': systems[system].name,
                'shortname': systems[system].shortname,
                'boxcdnversion': systems[system].boxcdnversion,
                'romcdnversion': systems[system].romcdnversion,
                'emuextention': systems[system].emuextention,
                'emuscript': systems[system].emuscript,
                'retroarch': systems[system].retroarch,
                'screenshotaspectratio': systems[system].screenshotaspectratio
            };

            //optional
            configdata.systemdetails[system]['recommendedshaders'] = systems[system].recommendedshaders || [];
            configdata.systemdetails[system]['autocapture'] = systems[system].autocapture || {};
        }
    }

    //default retroarch configuration
    configdata['retroarch'] = config.get('retroarch');

    //roms location
    configdata['rompath'] = config.get('rompath');

    //emulator scripts location
    configdata['emupath'] = config.get('emupath');

    //emulator extensions scripts location
    configdata['emuextentionspath'] = config.get('emuextentionspath');

    //shaders location
    configdata['shaderpath'] = config.get('shaderpath');

    //are rom dirtree structures flattened? (use gamekey as file name)
    configdata['flattenedromfiles'] = config.get('flattenedromfiles');

    //asset location
    configdata['assetpath'] = config.get('assetpath');

    //box art location
    configdata['boxpath'] = config.get('boxpath');

    configdata['flattenedboxfiles'] = config.get('flattenedboxfiles');

    configdata['maxSavesPerGame'] = config.get('maxSavesPerGame');

    var onFinish = function() {   

        
        playerdata.playhistory = {};
        playerdata.shaders = {};

        if (req.session) {

            //play history from session
            if (req.session.games && req.session.games.history) {
                playerdata.playhistory = req.session.games.history;
            }

            //shaders from session
            if (req.session.shaders) {
                playerdata.shaders = req.session.shaders;
            }
        }

        var result = {
            playerdata: playerdata,
            configdata: configdata
        };

        //because this json object is going over the wire, compress (client will decompress)
        return callback(null, UtilitiesService.compress.json(result));
    };

    if (openonload && openonload.title && openonload.system && openonload.file) {
        UtilitiesService.findGame(openonload.system, openonload.title, openonload.file, function(err, data) {
            if (err) {
                return callback(err);
            }
            playerdata.openonload = data;
            onFinish();
        });
    } else {
        onFinish();
    }
};

//order: stringify, encode, deflate, unescape, base64
UtilitiesService.compress = {
    bytearray: function(uint8array) {
        var deflated = pako.deflate(uint8array, {to: 'string'});
        return btoa(deflated);
    },
    json: function(json) {
        var string = JSON.stringify(json);
        var deflate = pako.deflate(string, {to: 'string'});
        var base64 = btoa(deflate);
        return base64;
    },
    string: function(string) {
        var deflate = pako.deflate(string, {to: 'string'});
        var base64 = btoa(deflate);
        return base64;
    },
    gamekey: function(system, title, file) {
        return this.json({
            system: system,
            title: title,
            file: file
        });
    }
};

//order: base 64, escape, inflate, decode, parse
UtilitiesService.decompress = {
    bytearray: function(item) {
        var decoded = new Uint8Array(atob(item).split('').map(function(c) {return c.charCodeAt(0);}));
        return pako.inflate(decoded);
    },
    json: function(item) {
        var base64 = atob(item);
        var inflate = pako.inflate(base64, {to: 'string'});
        var json = JSON.parse(inflate);
        return json;
    },
    string: function(item) {
        var base64 = atob(item);
        var inflate = pako.inflate(base64, {to: 'string'});
        return inflate;
    }
};

module.exports = UtilitiesService;
