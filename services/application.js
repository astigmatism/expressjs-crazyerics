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

    this._genreNames; //a private var for this object during the prep of application starting

    this.ApplicationEntry = function(req, callback) {

        if (req.session) {
            
            BuildComponentDataForEntry(req, (err, componentdata) => {

                BuildConfigForEntry((err, config) => {

                    var result = {
                        config: config,
                        components: componentdata
                    };
    
                    return callback(null, result);

                });
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

        var all_search = [];
        var all_suggestions_top = [];
        var all_suggestions_above = [];
        var total_titles = 0;

        var all_genres = {};

        //operations for each system
        async.each(Object.keys(systems), function(system, nextsystem) {

            if (config.has('systems.' + system + '.live') && !config.get('systems.' + system + '.live')) {
                console.log(system + ' is not live, skipping caching');
                return nextsystem();
            }

            //create features sets for this system
            //at some point during the hour, refresh the most played games feature for each system
            // CronService.RandomEveryHour(() => {
            //     FeaturedService.CreateMostPlayed(system, 6, 18, (err) => {
            //         if (err) console.log('Cron failed for CreateMostPlayed, system ' + system);
            //     });
            // }, true);

            //ok, lets open the data file (and also cache it)
            FileService.Get('/data/' + system + '_master', function(err, masterfile) {
                if (err) {
                    console.log('Could not find masterfile for ' + system + '.');
                    return nextsystem();
                }

                //best place for sql table insert check
                SystemsSQL.Exists(system, config.get('systems.' + system + '.name'), (err) => {
                    if (err) {
                        return callback(err);
                    }

                    //audit for metadata from the server (saved to file and cached)
                    FileService.Request(config.paths.audit + '/metadata/launchbox/' + system, (status, err, metadata) => {
                        if (err) metadata = {};

                        //callback includes categories for "all" suggestions and search
                        SuggestionService.CreateSystemSuggestions(system, masterfile, metadata, (err, search, top, above, genres, total) => {
                            if (err) return nextsystem(err);

                            //append the all_search which appropriate titles discovered for this system
                            all_search = all_search.concat(search);
                            all_suggestions_top = all_suggestions_top.concat(top);
                            all_suggestions_above = all_suggestions_above.concat(above);

                            //expand genres object
                            for (var genre in genres) {
                                if (!all_genres.hasOwnProperty(genre)) {
                                    all_genres[genre] = [];
                                }
                                all_genres[genre] = all_genres[genre].concat(genres[genre]);
                            }

                            total_titles += total;
                            
                            return nextsystem();
                        });
                    }, '/data/' + system + '_metadata');
                });

            }); //open masterfile

        }, 
        //the end of for each system
        function(err) {

            if (err) return callback(err);

            //cache results in file service because it has unlimited ttl
            //all system specific caches:
            FileService.Set('suggestions.all.top', all_suggestions_top);
            FileService.Set('suggestions.all.above', all_suggestions_above);

            FileService.Set('suggestions.all.data', {
                lengths: {
                    top: all_suggestions_top.length,
                    above: all_suggestions_above.length,
                    titles: total_titles
                }
            });
            
            FileService.Set('search.all', all_search);

            //separate all genres into their own cache
            for (var genre in all_genres) {
                FileService.Set('suggestions.all.genre.' + genre, all_genres[genre]);
            }

            //put genre names in config object
            FileService.Set('genre.names', Object.keys(all_genres));
            

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

    var BuildConfigForEntry = function(callback) {
        
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

        //genres
        FileService.Get('genre.names', (err, genres) => {
            if (err) {}

            configdata['genres'] = genres;

            return callback(null, configdata);
        });
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
