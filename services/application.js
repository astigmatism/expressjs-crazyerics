'use strict';
const async = require('async');
const config = require('config');
const FileService = require('./files');
const SystemsSQL = require('../db/systems');
const UtilitiesService = require('./utilities');
const UserService = require('./users');
const CollectionService = require('./collections');
const PreferencesService = require('./preferences');
const SuggestionService = require('./suggestions');
const GamesService = require('./games');
const FeaturedService = require('./featured');
const CronService = require('./cron');

module.exports = new (function() {

    this.ApplicationEntry = function(req, callback) {

        if (req.session) {
            
            BuildComponentDataForEntry(req, (err, componentdata) => {

                var result = {
                    config: BuildConfigForEntry(),
                    components: componentdata
                };

                return callback(null, result);
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
        
        //this will be a separate cache which considers a combination of ALL titles for all systems so that I don't have to merge the system cache later
        var all_suggestions = {
            top: [],
            above: []
            //no need to cache anything else
        }
        var all_search = []; //all systems search will include above threshold titles only
        var totaltitles = 0;

        async.each(Object.keys(systems), function(system, nextsystem) {

            if (config.has('systems.' + system + '.live') && !config.get('systems.' + system + '.live')) {
                console.log(system + ' is not live, skipping caching');
                return nextsystem();
            }

            //create features sets for this system
            //at some point during the hour, refresh the most played games feature for each system
            CronService.RandomEveryHour(() => {
                FeaturedService.CreateMostPlayed(system, 6, 18, (err) => {
                    if (err) console.log('Cron failed for CreateMostPlayed, system ' + system);
                });
            }, true);

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
                
                    //audit for boxart from the cdn server
                    FileService.Request(config.paths.audit + '/box/front/' + system, (status, err, boxFrontData) => {
                        if (err) {  
                            //in the case of error, continue because box fronts are not required, we just can't make suggestions for this system
                            console.log('Could not find boxart file for ' + system + '. No suggests can be made without boxart');
                            boxFrontData = {};
                        }

                        FileService.Get('/data/' + system + '_topsuggestions', function(err, topSuggestions) {
                            if (err) {
                                console.log('Could not find topsuggestions file for ' + system + '.');
                                topSuggestions = {};
                            }

                            var titlecount = 0;

                            var system_suggestions = {
                                top: [],            //top suggestions are those that have been marked in the box datafile as the most "inviting" titles for the system (my discretion!)
                                above: [],          //above suggestions threshold defined in config (generally US titles)
                                below: [],          //remaining box art below the defined threshold (generally foriegn, obscure and PD)
                                art: [],            //all titles with art (combination of above and below)
                                noart: [],          //the remaining titles without any boxart (don't use these for suggestions but cache them anyway)
                                all: [],            //all titles for this system without any conditions
                                alpha: {
                                    all: {},
                                    above: {}
                                }           //for browsing systems by alpha (a, b, c, d, etc)
                            }

                            //we'll cache a separate structure for search
                            var system_search = [];     //system specific search includes all titles

                            var systemSuggestionThreshold = config.has('systems.' + system + '.suggestionThreshold') ? config.get('systems.' + system + '.suggestionThreshold') : config.get('search').suggestionThreshold;
                            var titlesWithRating = 0;

                            //loop over each title in the masterfile
                            for (var title in data) {

                                var bestfile = data[title].b;
                                var bestrank = data[title].f[bestfile].rank;
                                var gk = data[title].f[bestfile].gk;
                                var isAbove = false;

                                //in order to be suggested must have art and must need minimum rank to be preferable playing game
                                //you can get systemSuggestionThreshold in config if needed
                                if (boxFrontData && title in boxFrontData) {

                                    //include thegamesdb rating info into suggestions cache (although i'm not use it at this time)
                                    if (thegamesdb && thegamesdb[title] && thegamesdb[title].Rating) {
                                        data[title].thegamesdbrating = thegamesdb[title].Rating;
                                        ++titlesWithRating;
                                    }

                                    //top suggestions. these titles can also exist in "best" and "foriegn" so be sure not to mix them (?)
                                    if (topSuggestions.hasOwnProperty(title)) {

                                        all_suggestions.top.push(gk);
                                        system_suggestions.top.push(gk);
                                    }
                                    
                                    //ok, now separate the remianing boxart titles between above the threshold and below it
                                    if (bestrank >= systemSuggestionThreshold) {

                                        all_suggestions.above.push(gk);
                                        system_suggestions.above.push(gk);
                                        isAbove = true; //for the alpha sort later

                                    } 
                                    //foreign suggestion (has art but doesn't meet the suggestion threshold for system)
                                    else {

                                        system_suggestions.below.push(gk);
                                    }

                                    //title has art
                                    system_suggestions.art.push(gk);
                                }
                                //title has no art
                                else {
                                    system_suggestions.noart.push(gk);
                                }

                                //all titles suggestions (if I ever use this)
                                system_suggestions.all.push(gk);

                                //alpha cache
                                var firstChar = title.slice(0,1); //take first character
                                if (firstChar.match(/[a-z]/i)) {
                                    firstChar = firstChar.toUpperCase();
                                    
                                    system_suggestions.alpha.all = UtilitiesService.CreatePropertyIfNotThere(system_suggestions.alpha.all, firstChar, []);
                                    system_suggestions.alpha.all[firstChar].push(gk);
                                    
                                    if (isAbove) {

                                        system_suggestions.alpha.above = UtilitiesService.CreatePropertyIfNotThere(system_suggestions.alpha.above, firstChar, []);
                                        system_suggestions.alpha.above[firstChar].push(gk);
                                    }
                                }
                                //else is 0-9 or a symbol
                                else {
                                    
                                    system_suggestions.alpha.all = UtilitiesService.CreatePropertyIfNotThere(system_suggestions.alpha.all, '#', []);
                                    system_suggestions.alpha.all['#'].push(gk);

                                    if (isAbove) {

                                        system_suggestions.alpha.above = UtilitiesService.CreatePropertyIfNotThere(system_suggestions.alpha.above, '#', []);
                                        system_suggestions.alpha.above['#'].push(gk);
                                    }
                                }

                                //if the rank of the best playable file for the title is above the threshold for this system
                                if (isAbove) {
                                    all_search.push({
                                        t: title,
                                        r: bestrank,
                                        gk: gk
                                    });
                                }

                                //okay, while we're at it, let's build a customized search file for this system
                                //no qualifications for system search, all titles. 
                                //I found it fastest to iterator with for in. the property doesn't matter since we have
                                //to iterate over all props
                                system_search[titlecount] = {
                                    t: title,
                                    r: bestrank,
                                    gk: gk
                                }

                                ++titlecount;
                            
                            } //end for each title in masterfile

                            totaltitles += titlecount;

                            //cache results in file service because it has unlimited ttl
                            //system specific caches:
                            FileService.Set('suggestions.' + system + '.top', system_suggestions.top);
                            FileService.Set('suggestions.' + system + '.above', system_suggestions.above);
                            FileService.Set('suggestions.' + system + '.below', system_suggestions.below);
                            FileService.Set('suggestions.' + system + '.art', system_suggestions.art);
                            FileService.Set('suggestions.' + system + '.noart', system_suggestions.noart);
                            FileService.Set('suggestions.' + system + '.all', system_suggestions.all);
                            for (var alpha in system_suggestions.alpha.all) {
                                FileService.Set('suggestions.' + system + '.alpha.all.' + alpha, system_suggestions.alpha.all[alpha]);    
                            }
                            for (var alpha in system_suggestions.alpha.above) {
                                FileService.Set('suggestions.' + system + '.alpha.above.' + alpha, system_suggestions.alpha.above[alpha]);    
                            }
                            
                            //for cache lengths and other misc data so that I don't need to calculate each time when I access them later
                            FileService.Set('suggestions.' + system + '.data', {
                                lengths: {
                                    top: system_suggestions.top.length,
                                    above: system_suggestions.above.length,
                                    below: system_suggestions.below.length,
                                    art: system_suggestions.art.length,
                                    noart: system_suggestions.noart.length,
                                    all: titlecount
                                }
                            });
                            
                            FileService.Set('search.' + system, system_search); //ok to be sync

                            //console.log('suggestions.' + system + ' (threshold: ' + systemSuggestionThreshold + ') "inviting" suggestions --> ' + suggestions.top.length + '. suggestions above threshold --> ' + suggestions.above.length + '. suggestions below threshhold --> ' + suggestions.below.length + '. total with thegamesdb rating --> ' + titlesWithRating);
                            
                            //best place for sql table insert check
                            //note: I realize I could begin doing a title, even file insert check here, but I'd rather leave that operation to a client play request
                            SystemsSQL.Exists(system, config.get('systems.' + system + '.name'), (err) => {
                                if (err) {
                                    return nextsystem(err);
                                }
                                nextsystem();
                            });
                        }); //get topsuggestions
                    }, '/data/' + system + '_boxfronts'); //box front audit request. final param is the path to save the response to
                }); //open thegamesdb
            }); //open masterfile

        }, 
        //the end of for each system
        function(err) {

            if (err) return callback(err);

            //cache results in file service because it has unlimited ttl
            //all system specific caches:
            FileService.Set('suggestions.all.top', all_suggestions.top);
            FileService.Set('suggestions.all.above', all_suggestions.above);

            FileService.Set('suggestions.all.data', {
                lengths: {
                    top: all_suggestions.top.length,
                    above: all_suggestions.above.length,
                    titles: totaltitles
                }
            });
            
            FileService.Set('search.all', all_search);

            //i found that generating a unique suggestions (for all, system) was inefficient, so I will create canned versions instead, the player will not notice :)
            SuggestionService.CreateCanned((err) => {
                if (err) {
                    return callback(err);
                }

                console.log('Crazyerics application start-up complete! Enjoy ;)');

                callback();
            });
        });

        //build the featured titles cache from the sets saved in the file system
        FeaturedService.RefreshFromFiles((err) => {
            if (err) console.log(err);
        });
    };

    var BuildConfigForEntry = function() {
        
        var configdata = {};
        var systems = config.get('systems');
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
                    'retroarch': systems[system].retroarch,
                    'screenshotaspectratio': systems[system].screenshotaspectratio,
                    'supportfilesize': systems[system].supportfilesize,
                    'cannedSuggestion': false
                };

                //does this system have a canned receipe for suggestions?
                if (canned[system]) {
                    configdata.systemdetails[system].cannedSuggestion = true;
                }

                //defined or use default values
                configdata.systemdetails[system]['recommendedshaders'] = systems[system].recommendedshaders || systems.default.recommendedshaders;
            }
        }

        //default retroarch configuration
        configdata['retroarch'] = config.get('retroarch');

        //paths 
        configdata['paths'] = config.get('paths');

        //button mappings
        configdata['mappings'] = config.get('mappings');

        //settings defaults for client
        configdata['defaults'] = config.get('defaults');

        //loading box art recipes
        configdata['loadingBoxRecipes'] = config.get('loadingBoxRecipes');

        return configdata;
    };

    //try only to include absolutely necessary data for entry
    var BuildComponentDataForEntry = function(req, callback) {

        //since this footprint is going out over the wire, use less characters for names
        var components = {
            c: {},
            p: {},
            f: {}
        };

        if (req.user) {

            var userId = req.user.user_id;
            
            //get client data with sync
            CollectionService.Sync.Outgoing(userId, (err, collectionPayload) => {
                if (err) return callback(err);

                components.c = collectionPayload;

                PreferencesService.Sync.Outgoing(userId, (err, preferencesPayload) => {
                    if (err) return callback(err);

                    components.p = preferencesPayload;

                    FeaturedService.Sync.Outgoing((err, featuredPayload) => {
                        if (err) return callback(err);

                        components.f = featuredPayload;

                        callback(null, components);
                    });
                });
            });
        } else {
            res.error('user not on request object');
        }
    };
});
