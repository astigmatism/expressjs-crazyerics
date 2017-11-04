'use strict';
const fs = require('fs');
const async = require('async');
const config = require('config');
const FileService = require('./files');
const SystemsSQL = require('../db/systems');
const UtilitiesService = require('./utilities');
const UserService = require('./users');
const CollectionService = require('./collections');
const PreferencesService = require('./preferences');
const SuggestionService = require('./suggestions');

module.exports = new (function() {

    this.ApplicationEntry = function(req, callback) {

        if (req.session) {
            
            BuildComponentDataForEntry(req, (err, componentdata) => {

                var result = {
                    config: BuildConfigForEntry(),
                    components: componentdata
                };

                return callback(null, UtilitiesService.Compress.json(result));
            });
        }
        else {
            return callback('session not on request object');
        }
    };

    /**
     * This runs on application start. The goal here is to mainly cache freqently accessed data.
     */
    this.ApplicationStart = function(callback) {

        //put into cache all the data files
        var systems = config.get('systems');
        var searchall = {};
        var titlecount = 0;
        
        //when suggesting titles for all consoles we'll use this object, 
        //it's structure considers system to evenly suggest titles by system
        //the keys will be systems (except for data which I use for other things)
        var suggestionsall = {
            'data': {
                'alltitlecount': 0,
                'topSuggestionCount': 0,
                'aboveSuggestionCount': 0,
                'belowSuggestionCount': 0
            }
        }; 
        

        async.each(Object.keys(systems), function(system, nextsystem) {

            if (config.has('systems.' + system + '.live') && !config.get('systems.' + system + '.live')) {
                console.log(system + ' is not live, skipping caching');
                return nextsystem();
            }

            //ok, lets open the data file
            FileService.Get('/data/' + system + '_master', function(err, data) {
                if (err) {
                    console.log('Could not find masterfile for ' + system + '.');
                    return nextsystem();
                }

                //let's cache files in this section
                FileService.Get('/data/' + system + '_thegamesdb', function(err, thegamesdb) {
                    if (err) {
                        console.log('Could not find thegamesdb file for ' + system + '.');
                    }

                    FileService.Get('/data/' + system + '_filedata', function(err, filedata) {
                        if (err) {
                            console.log('Could not find filedata file for ' + system + '.');
                        }
                

                        //let's try opening the boxart data file now too
                        FileService.Get('/data/' + system + '_boxart', function(err, boxartdata) {
                            if (err) {
                                console.log('Could not find boxart file for ' + system + '. No suggests can be made without boxart');
                                //if error, console log only, we can still build cache
                            }

                            //we'll cache a separate structure for each system (to avoid using the heavier all suggestions cache)
                            var suggestions = {
                                'top': [],          //top suggestions are those that have been marked in the box datafile as the most "inviting" titles for the system (my discretion!)
                                'above': [],        //above suggestions threshold defined in config
                                'below': [],        //remaining box art below the defined threshold
                                'data': {}
                            };

                            //add new key for this system to all suggestions
                            suggestionsall[system] = {
                                'top': [],
                                'above': [],
                                'below': [],
                                'data': {}
                            };

                            //we'll cache a separate structure for search
                            var search = [];

                            var systemSuggestionThreshold = config.has('systems.' + system + '.suggestionThreshold') ? config.get('systems.' + system + '.suggestionThreshold') : config.get('search').suggestionThreshold;
                            var titlesWithRating = 0;

                            //ok, let's build the all.json file with the data from each file
                            for (var title in data) {

                                var bestfile = data[title].b;
                                var bestrank = data[title].f[bestfile].rank;
                                var gk = data[title].f[bestfile].gk;

                                //in order to be suggested must have art and must need minimum rank to be preferable playing game
                                //you can get systemSuggestionThreshold in config if needed
                                if (boxartdata && title in boxartdata) {

                                    //include thegamesdb rating info into suggestions cache
                                    if (thegamesdb && thegamesdb[title] && thegamesdb[title].Rating) {
                                        data[title].thegamesdbrating = thegamesdb[title].Rating;
                                        ++titlesWithRating;
                                    }

                                    //top suggestions. these titles can also exist in "best" and "foriegn" so be sure not to mix them
                                    if (boxartdata[title].hasOwnProperty('t')) {

                                        //add to all suggestions
                                        suggestionsall[system].top.push(title);
                                        suggestionsall[system].data[title] = data[title];

                                        //increase counter
                                        ++suggestionsall.data.topSuggestionCount;

                                        //add to system suggestions
                                        suggestions.top.push(title);
                                        suggestions.data[title] = data[title];
                                    }
                                    
                                    //ok, now separate the remianing boxart titles between above the threshold and below it
                                    if (bestrank >= systemSuggestionThreshold) {
                                        
                                        //add to all suggestions
                                        suggestionsall[system].above.push(title);
                                        suggestionsall[system].data[title] = data[title];   

                                        //increase counter
                                        ++suggestionsall.data.aboveSuggestionCount;

                                        //add to system suggestions
                                        suggestions.above.push(title);
                                        suggestions.data[title] = data[title];

                                    } else {
                                        
                                        //foreign suggestion (has art but doesn't meet the suggestion threshold for system)
                                        
                                        //add to system suggestions
                                        suggestions.below.push(title);
                                        suggestions.data[title] = data[title];

                                        //all suggestions not cached dont care
                                        
                                        //increase counter
                                        ++suggestionsall.data.belowSuggestionCount;
                                    }
                                }

                                //if the rank of the best playable file for the title is above the threshold for part of all-console search
                                if (bestrank >= config.get('search').searchAllThreshold) {
                                    searchall[titlecount] = {
                                        t: title,
                                        r: bestrank,
                                        gk: gk
                                    }
                                }
                                
                                //increase counter
                                ++suggestionsall.data.alltitlecount;

                                //okay, while we're at it, let's build a customized search file for this system
                                //no qualifications for system search, all titles. 
                                //I found it fastest to iterator with for in. the property doesn't matter since we have
                                //to iterate over all props
                                search[titlecount] = {
                                    t: title,
                                    r: bestrank,
                                    gk: gk
                                }

                                ++titlecount;
                            }

                            //cache results in file service because it has unlimited ttl
                            FileService.Set('suggestions.' + system, suggestions); //ok to be sync
                            FileService.Set('search.' + system, search); //ok to be sync

                            //console.log('suggestions.' + system + ' (threshold: ' + systemSuggestionThreshold + ') "inviting" suggestions --> ' + suggestions.top.length + '. suggestions above threshold --> ' + suggestions.above.length + '. suggestions below threshhold --> ' + suggestions.below.length + '. total with thegamesdb rating --> ' + titlesWithRating);
                            
                            //best place for sql table insert check
                            //note: I realize I could begin doing a title, even file insert check here, but I'd rather leave that operation to a client play request
                            SystemsSQL.Exists(system, config.get('systems.' + system + '.name'), (err) => {
                                if (err) {
                                    return nextsystem(err);
                                }
                                nextsystem();
                            });
                        });
                    });
                });
            });

        }, function(err) {
            if (err) {
                return callback(err);
            }

            //put the created-through-summing "all" results in file service (unlimited ttl)
            FileService.Set('suggestions.all', suggestionsall);
            FileService.Set('search.all', searchall);

            //i found that generating a unique suggestions (for all, system) was inefficient, so I will create canned versions instead, the player will not notice :)
            SuggestionService.CreateCanned((err) => {
                if (err) {
                    return callback(err);
                }
                callback();
            });
        });
    };

    var BuildConfigForEntry = function() {
        
        var configdata = {};
        var systems = config.get('systems');
        var emulators = config.get('emulators');
        var canned = config.get('cannedRecipes');

        configdata['systemdetails'] = {};

        //system specific configs
        for (var system in systems) {
            
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
                    'emusize': emulators[systems[system].emuscript].s, //the emu script is the key into this config
                    'retroarch': systems[system].retroarch,
                    'screenshotaspectratio': systems[system].screenshotaspectratio,
                    'supportfilesize': systems[system].supportfilesize,
                    'cannedSuggestion': false
                };

                //does this system have a canned receipe for suggestions?
                if (canned[system]) {
                    configdata.systemdetails[system].cannedSuggestion = true;
                }

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

        //emulator support files location
        configdata['emusupportfilespath'] = config.get('supportpath');

        //shaders location
        configdata['shaderpath'] = config.get('shaderpath');

        //asset location
        configdata['assetpath'] = config.get('assetpath');

        //box art location
        configdata['boxpath'] = config.get('boxpath');

        configdata['maxSavesPerGame'] = config.get('maxSavesPerGame');

        return configdata;
    };

    //try only to include absolutely necessary data for entry
    var BuildComponentDataForEntry = function(req, callback) {

        //since this footprint is going out over the wire, use less characters for names
        var components = {
            c: {},
            p: {}
        };

        if (req.user) {

            var userId = req.user.user_id;

            //get client data with sync
            CollectionService.Sync.Outgoing(userId, (err, collectionPayload) => {
                if (err) {
                    return callback(err);
                }
                components.c = collectionPayload;

                PreferencesService.Sync.Outgoing(userId, (err, preferencesPayload) => {
                        
                    components.p = preferencesPayload;

                    callback(null, components);
                });
            });
        } else {
            res.error('user not on request object');
        }
    };
});
