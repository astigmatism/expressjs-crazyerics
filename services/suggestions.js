'use strict';
const async = require('async');
const config = require('config');
const UtilitiesService = require('./utilities');
const FileService = require('./files');

/*
example recipe: {
    systems: {
        nes: {
            set: 0,
            proportion: 20
        }
    },
    count: 100
}
*/

module.exports = new (function() {

    var _self = this;

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
                            result.push({
                                system: _system,
                                title: set[i],
                                file: allCache[_system].data[set[i]].b, //the best file is the playable one
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
                    set = UtilitiesService.Shuffle(set);

                    //to know how many to pull, use proportion of total count needed in response
                    var limit = recipe.count * (parseInt(details.proportion, 10) / 100);

                    for (var i = 0, len = set.length; i < len && i < limit; ++i) {
                        result.push({
                            system: system,
                            title: set[i],
                            file: caches[system].data[set[i]].b, //the best file is the playable one
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
                result = UtilitiesService.Shuffle(result);

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

})();
