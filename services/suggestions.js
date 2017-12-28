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
            set: 0,             //set is 0 = top (defined in boxart, you click it), 1 = above, 2 = above & below (basically all), 3 = below.
            proportion: 20,
            randomize: true,    //randomize selections for this system, otherwise taken alphabetically from system cache
            filter: {
                begins: 'a'
            }
        }
    },
    randomize: true,           //randomize all results. default is true, otherwise all systems games are grouped together.
    count: 100
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

        PullCaches(recipe, function(err, caches) {
            if (err) {
                return callback(err);
            }

            //loop over systems
            async.forEachOf(recipe.systems, function(details, system, nextsystem) {

                //for each system, take from defined set the proportion of the total count
                //the resulting set will be titles only, reach into the cache data for details
                var set = null;

                //if system is "all"
                //sorry this is complicated. the all structure differes from the systems because titles can be the same between systems
                //as a result, we have to consider systems and titles in the cache
                if (system == 'all') {

                    var allCache = caches[system];
                    var countForAll = recipe.count * (parseInt(details.proportion, 10) / 100); //the number of entries for "all"

                    //for each system in the all cache
                    async.each(Object.keys(allCache), function(_system, _nextsystem) {

                        if (_system === 'data') {
                            return _nextsystem();
                        }

                        //the ratio of suggestable titles of this system to all titles suggestable from all systems inside the given set
                        var ratio;

                        switch (details.set) {
                            case 0: 
                            set = allCache[_system].top;
                            ratio = Math.ceil(set.length / allCache.data.topSuggestionCount);
                            break;
                            case 1:
                            set = allCache[_system].above;
                            ratio = Math.ceil(set.length / allCache.data.aboveSuggestionCount);
                            break;
                            case 2: 
                            set = allCache[_system].above.concat(allCache[_system].below);
                            ratio = Math.ceil(set.length / (allCache.data.aboveSuggestionCount + allCache.data.belowSuggestionCount));
                            break;
                            case 3:
                            set = allCache[_system].below;
                            ratio = Math.ceil(set.length / allCache.data.belowSuggestionCount);
                            break;
                        }

                        //how many of the items to suggest overall should be from this system?
                        var tosuggest = (ratio * countForAll);

                        //shuffle the set to pull random results
                        set = UtilitiesService.Shuffle(set);

                        for (var i = 0, len = set.length; i < len && i < tosuggest; ++i) {
                            
                            var bestfile = allCache[_system].data[set[i]].b;
                            var gk = allCache[_system].data[set[i]].f[bestfile].gk;

                            result.push({
                                gk: gk,
                                rating: parseFloat(allCache[_system].data[set[i]].thegamesdbrating) || 0
                            });
                        }

                        _nextsystem();

                    }, function(err) {
                        if (err) {
                            return nextsystem(err);
                        }
                        nextsystem();
                    });
                        
                }

                //system is not "all"
                else {

                    var _recipe = recipe.systems[system]; //system specific local var

                    switch (details.set) {
                        case 0:
                        set = caches[system].top;
                        break;
                        case 1:
                        set = caches[system].above;
                        break;
                        case 2: 
                        set = caches[system].above.concat(caches[system].below);
                        break;
                        case 3:
                        set = caches[system].below;
                        break;
                    }

                    //shuffle the set to pull random results
                    if (_recipe.randomize !== false) {
                        set = UtilitiesService.Shuffle(set);
                    }

                    //to know how many to pull, use proportion of total count needed in response
                    var limit = recipe.count * (parseInt(details.proportion, 10) / 100);

                    //loop over cache, selecting results
                    for (var i = 0, len = set.length; i < len && i < limit; ++i) {
                        
                        var bestfile = caches[system].data[set[i]].b;
                        var gk = caches[system].data[set[i]].f[bestfile].gk; //looks crazy but matches the masterfile

                        //respect filter
                        if (_recipe.filter) {
                            if (_recipe.filter.begins) {

                                //title must match or continue to next
                                var regex = new RegExp('^' + _recipe.filter.begins + '.*');
                                if (!set[i].match(regex)) {
                                    continue;
                                }

                            }
                        }

                        result.push({
                            // system: system,
                            // title: set[i],
                            // file: bestfile,
                            gk: gk,
                            rating: parseFloat(caches[system].data[set[i]].thegamesdbrating) || 0
                        });
                    }

                    nextsystem();
                }

            }, function(err) {
                if (err) {
                    return callback(err);
                }

                //randomize (otherwise all system games are grouped together)
                if (recipe.randomize !== false) {
                    result = UtilitiesService.Shuffle(result);
                }
                

                //retain original amount (possible to go over for all the all recipe)
                result = result.slice(0, recipe.count);

                callback(null, result);
            });

        });
    };

    var PullCaches = function(recipe, callback) {

        var caches = {};

        //pull cache for each system
        async.forEachOf(recipe.systems, function(details, system, nextsystem) {

            FileService.Get('suggestions.' + system, function(err, cache) {
                if (err) {
                    return nextsystem(err);
                }
                caches[system] = cache;

                nextsystem();
            });

        }, function(err) {
            if (err) {
                return callback(err);
            }
            callback(null, caches);
        });
    };
    

    this.CreateCanned = function(callback) {

        var definitions = config.get('cannedRecipes');

        async.eachOf(definitions, (definition, definitionName, nextDefinition) => {

            var recipe = definition.recipe;
            var samples = definition.samples;

            async.times(samples, function(i, next) {
                
                _self.Get(recipe, (err, suggestions) => {
                    if (err) {
                        return next(err);
                    }
                    FileService.Set('suggestions.canned.' + definitionName + '.' + i, suggestions);
                    next();
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
    }

})();
