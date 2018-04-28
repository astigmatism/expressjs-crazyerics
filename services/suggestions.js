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
        }
    },
    randomize: true,                // default: true. randomize all results. otherwise all systems games are grouped together.
    maximum: 80                     // default: 80, as grid is 8 across. The maximum number of results to return. -1 means there is no limit.
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

            FileService.Get('suggestions.' + system + '.' + cacheType, (err, cache) => {
                if (err) {
                    return nextsystem(err);
                }

                //randomze the result for this system?
                if (details.randomize !== false) {
                    cache = UtilitiesService.Shuffle(cache);
                }

                var numberToSelect = maximum * proportion;
                
                //when maximum -1, doesn't restrict results, pulls from entire cache length
                if (maximum < 0) {
                    numberToSelect = cache.length;
                }
                for (var i = 0, len = cache.length; i < len && i < numberToSelect; ++i) {

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
