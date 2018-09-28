'use strict';
const async = require('async');
const config = require('config');
const UtilitiesService = require('./utilities');
const FileService = require('./files');
const GamesService = require('./games');

/*
example recipe: {
    systems: {
        nes: {
            cache: 0,               // default: top. top, above, below, noart, art (above + below), all, alpha.x. (for system "all" only top and above)
            proportion: 0.2,         // default: 1. proportion relative to the total count (between 0 and 1)
            randomize: true,        // default: true. randomize selections for this system, otherwise taken alphabetically from system cache
            genre: all              // default all. filter results from the genre catagory of their metadata
        }
    },
    randomize: true,                // default: true. randomize all results. otherwise all systems games are grouped together.
    maximum: 80                     // default: 80, as grid is 8 across. The maximum number of results to return
    page: 1                         // default: 0. Pagination. When positive, starts result set at n * maximum 
}
*/

module.exports = new (function() {

    var _self = this;

    //get cached canned suggestions result. recipeName matches cache name and config entry
    this.GetCanned = function(name, callback, opt_cacheSet) {

        //first get total number of cached results
        var samples = config.get('cannedRecipes.' + name + '.samples');
        if (!samples) {
            return callback();
        }
        //get a random get from cache (or if defined, a specific one)
        var cacheSet = opt_cacheSet || Math.floor(Math.random() * (samples - 0) + 0);

        FileService.Get('suggestions.canned.' + name + '.' + cacheSet, (err, cache) => {
            if (err) {
                return callback(err);
            }
            if (!cache) {
                return callback();
            }
            callback(null, cache);
        });
    };

    this.Get = function(recipe, callback) {

        var result = [];
        var systems = config.get('systems');
        var maximum = recipe.maximum || 80;

        //loop over system definitions in recipe
        async.forEachOf(recipe.systems, function(details, system, nextsystem) {

            //skip building systems which are disabled currently
            if (system !== 'all' && !systems[system].live) {
                return nextsystem();
            }

            //get cache (cache is an array of gk's)
            var cacheType = details.cache || 'top';
            var proportion = details.proportion || 1; //100% unless defined otherwise
            
            //use genre cache?
            if (details.genre && details.genre !== 'all') {
                cacheType = 'genre.' + details.genre;
            }

            FileService.Get('suggestions.' + system + '.' + cacheType, (err, cache) => {
                if (err) {
                    return nextsystem(err);
                }

                var numberToStartSelection = 0;

                //randomze the result for this system?
                if (details.randomize !== false) {
                    cache = UtilitiesService.Shuffle(cache);
                }
                else {
                    //if the result is not randomized, it is alphabetical. should we consider pagination?
                    numberToStartSelection = recipe.page * maximum;

                }

                var numberToSelect = numberToStartSelection + (maximum * proportion);
                
                //when maximum -1, doesn't restrict results, pulls from entire cache length
                // if (maximum < 0) {
                //     numberToSelect = cache.length;
                // }

                var len = cache.length

                for (var i = numberToStartSelection; i < len && i < numberToSelect; ++i) {

                    result.push(cache[i]);
                }
                nextsystem();
            });

        }, (err) => {
            if (err) return callback(err);

            //randomize (otherwise all system games are grouped together)
            if (recipe.randomize !== false) {
                result = UtilitiesService.Shuffle(result);
            }
            
            //retain original amount (possible to go over with ratios)
            if (maximum >= 0) {
                result = result.slice(0, maximum);
            }

            callback(null, result);
        });
    };

    this.CreateCanned = function(callback) {

        var definitions = config.get('cannedRecipes');

        async.eachOf(definitions, (definition, definitionName, nextDefinition) => {

            if (config.has('systems.' + definitionName + '.live') && !config.get('systems.' + definitionName + '.live')) {
                console.log(definitionName + ' is not live, skipping canned suggestions caching');
                return nextDefinition();
            }

            var recipe = definition.recipe;
            var samples = definition.samples;

            async.times(samples, function(i, next) {
                
                _self.Get(recipe, (err, suggestions) => {
                    if (err) {
                        return next(err);
                    }
                    FileService.Set('suggestions.canned.' + definitionName + '.' + i, suggestions, (err) => {
                        if (err) return next(err);

                        return next();
                    });
                    
                });
            }, function(err) {
                if (err) {
                    return nextDefinition(err);
                }

                nextDefinition();
            });
        }, (err) => {
            if (err) {
                return callback(err);
            }
            callback();    
        })
    };

    this.CreateSystemSuggestions = function(system, masterFile, metadata, callback) {

        var all_suggestions_top = [];
        var all_suggestions_above = [];
        var total_titles = 0;
        var all_search = []; //all systems search will include above threshold titles only, this discovery is made here and returned in the callback

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
                    genres: {},          //by genre
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
                for (var title in masterFile) {

                    var bestfile = masterFile[title].b;
                    var bestrank = masterFile[title].f[bestfile].rank;
                    var gk = masterFile[title].f[bestfile].gk;
                    var isAbove = false;

                    //in order to be suggested must have art and must need minimum rank to be preferable playing game
                    //you can get systemSuggestionThreshold in config if needed
                    if (boxFrontData && title in boxFrontData) {

                        //include thegamesdb rating info into suggestions cache (although i'm not use it at this time)
                        // if (thegamesdb && thegamesdb[title] && thegamesdb[title].Rating) {
                        //     data[title].thegamesdbrating = thegamesdb[title].Rating;
                        //     ++titlesWithRating;
                        // }

                        //top suggestions. these titles can also exist in "best" and "foriegn" so be sure not to mix them (?)
                        if (topSuggestions.hasOwnProperty(title)) {

                            all_suggestions_top.push(gk);
                            system_suggestions.top.push(gk);
                        }
                        
                        //ok, now separate the remianing boxart titles between above the threshold and below it
                        if (bestrank >= systemSuggestionThreshold) {

                            all_suggestions_above.push(gk);
                            system_suggestions.above.push(gk);
                            isAbove = true; //for the alpha sort later

                        } 
                        //foreign suggestion (has art but doesn't meet the suggestion threshold for system)
                        else {

                            system_suggestions.below.push(gk);
                        }

                        //separately, let's cache the suggestion in genre cache
                        if (metadata.hasOwnProperty(title)) {
                            if (typeof metadata[title].Genres === 'string') {
                                metadata[title].Genres.split(';').forEach(item => {
                                    item = item.trim();
                                    if (!system_suggestions.genres.hasOwnProperty(item)) {
                                        system_suggestions.genres[item] = [];
                                    }
                                    system_suggestions.genres[item].push(gk);
                                });
                            }
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

                total_titles += titlecount;

                //cache results in file service because it has unlimited ttl
                //system specific caches:
                FileService.Set('suggestions.' + system + '.top', system_suggestions.top);
                FileService.Set('suggestions.' + system + '.above', system_suggestions.above);
                FileService.Set('suggestions.' + system + '.below', system_suggestions.below);
                FileService.Set('suggestions.' + system + '.art', system_suggestions.art);
                FileService.Set('suggestions.' + system + '.noart', system_suggestions.noart);
                FileService.Set('suggestions.' + system + '.all', system_suggestions.all);

                //each genre in its own cache
                for (var genre in system_suggestions.genres) {
                    FileService.Set('suggestions.' + system + '.genre.' + genre, system_suggestions.genres[genre]);
                }

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
                        all: total_titles
                    }
                });
                
                FileService.Set('search.' + system, system_search); //ok to be sync

                //console.log('suggestions.' + system + ' (threshold: ' + systemSuggestionThreshold + ') "inviting" suggestions --> ' + suggestions.top.length + '. suggestions above threshold --> ' + suggestions.above.length + '. suggestions below threshhold --> ' + suggestions.below.length + '. total with thegamesdb rating --> ' + titlesWithRating);
                
                return callback(null, all_search, all_suggestions_top, all_suggestions_above, system_suggestions.genres, total_titles);

            });
        }, '/data/' + system + '_boxfronts'); //box front audit request. final param is the path to save the response to
    };

})();
