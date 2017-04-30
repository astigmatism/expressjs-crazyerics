var fs = require('fs');
var async = require('async');
var config = require('config');
var UtilitiesService = require('./utilities.js');

/**
 * Constructor
 */
SuggestionsService = function() {
};

/*
recipe: {
    systems: {
        nes: {
            set: 0,
            proportion: 20
        }
    },
    count: 100
}
*/
SuggestionsService.Get = function(recipe, callback) {

    var result = [];
    var systems = config.get('systems');

    SuggestionsService.PullCaches(recipe, function(err, caches) {
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
                    set = UtilitiesService.shuffle(set);

                    for (var i = 0, len = set.length; i < len && i < tosuggest; ++i) {
                        result.push({
                            system: _system,
                            title: set[i],
                            file: allCache[_system].data[set[i]].best, //the best file is the playable one
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
                set = UtilitiesService.shuffle(set);

                //to know how many to pull, use proportion of total count needed in response
                var limit = recipe.count * (parseInt(details.proportion, 10) / 100);

                for (var i = 0, len = set.length; i < len && i < limit; ++i) {
                    result.push({
                        system: system,
                        title: set[i],
                        file: caches[system].data[set[i]].best, //the best file is the playable one
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
            result = UtilitiesService.shuffle(result);

            //retain original amount (possible to go over for all the all recipe)
            result = result.slice(0, recipe.count);

            callback(null, result);
        });

    });
};

SuggestionsService.PullCaches = function(recipe, callback) {

    var caches = {};

    //pull cache for each system
    async.forEachOf(recipe.systems, function(details, system, nextsystem) {

        FileService.getCache('suggestions.' + system, function(err, cache) {
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

/**
 * Getting suggestions for all system involves a custom routine which uses the cache we built on the start of the app which contains
 * a json object of all suggestable games for all systems. It is pretty heavyweight but better than openning each system suggestions
 * cache file individually. We evenly take suggestions from each system based on the overall number of suggestions that system has to
 * offer
 * @param  {number}   items    the number of suggestions to return
 * @param  {Function} callback
 * @return {undef}
 */
SuggestionsService.findSuggestionsAll = function(items, callback) {

    var aggrigation = [];
    var systems = config.get('systems');

    FileService.getCache('suggestions.all', function(err, suggestionsCache) {

        async.each(Object.keys(suggestionsCache), function(system, nextsystem) {

            //this is a child of the all suggestions cache which is used for data
            if (system == 'data') {
                return nextsystem();
            }

            //the ratio of suggestable titles of this system to all titles suggestable from all systems
            var ratio = suggestionsCache[system].best.length / suggestionsCache.data.allsuggestioncount;

            //how many of the items to suggest overall should be from this system?
            var tosuggest = (ratio * items);

            //randomize the titles for this system
            var systemsuggestions = UtilitiesService.shuffle(suggestionsCache[system].best);

            //never suggest more than this system has suggestions
            if (tosuggest > systemsuggestions.length) {
                tosuggest = systemsuggestions.length;
            }

            //take the first however many are needed
            for (var i = 0; i < tosuggest; ++i) {
                aggrigation.push({
                    system: system,
                    title: systemsuggestions[i],
                    file: suggestionsCache[system].data[systemsuggestions[i]].best, //the best file is the playable one
                    rating: parseFloat(suggestionsCache[system].data[systemsuggestions[i]].thegamesdbrating) || 0
                });
            }
            nextsystem();

        }, function(err) {
            if (err) {
                return callback(err);
            }

            //retain original amount (possible to go over because we found suggests as items / systems.length)
            aggrigation = aggrigation.slice(0, items);

            //randomize (otherwise all system games are grouped together)
            aggrigation = UtilitiesService.shuffle(aggrigation);

            //finally sort by thegamesdbrating value (commented out because theres just not enough data yet)
            // aggrigation.sort(function(a, b) {
            //     if (a.rating > b.rating)
            //         return -1;
            //     if (b.rating > a.rating)
            //         return 1;
            //     return 0;
            // });

            callback(null, aggrigation);
        });

    });
};

/**
 * Using the cache we built on the start of the application, get "items" number of suggestable games from that list.
 * We can adjust the amount of possibility of getting back foreign titles as well
 * @param  {string}   system
 * @param  {number}   items
 * @param  {number}   forgienMixPerc
 * @param  {Function} callback
 * @return {undef}
 */
SuggestionsService.findSuggestions = function(system, items, forgienMixPerc, callback) {

    var results = [];
    var i;

    //get suggestions cache
    FileService.getCache('suggestions.' + system, function(err, suggestionsCache) {
        if (err) {
            return callback(err);
        }

        var suggestions = suggestionsCache.best; //shuffle all suggestions to randomize

        //should we mix in foreign titles?
        if (forgienMixPerc > 0) {

            foreignsuggestions = UtilitiesService.shuffle(suggestionsCache.foreign); //shuffle up foreign titles

            var foreigns = suggestions.length * forgienMixPerc; //number of formeign titles to mix into total

            //console.log('foreigns mixed in: ' + foreigns);

            for (i = 0; i < foreigns; ++i) {
                suggestions.push(foreignsuggestions[i]); //push them into the other suggestions array
            }
        }

        suggestions = UtilitiesService.shuffle(suggestions); //randomize all results

        //run over all games
        for (i = 0; i < items; ++i) {
            
            if (suggestions[i % suggestions.length]) {

                //in the result, use the game as the key and its values the file and rank
                results.push({
                    system: system,
                    title: suggestions[i % suggestions.length],
                    file: suggestionsCache.data[suggestions[i % suggestions.length]].best
                });
            }
        }
        callback(null, results);
    });
}; 

/**
 * suffles the contents of an array
 * @param  {Array} o
 * @return {Array}
 */
UtilitiesService.shuffle = function(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}; 

UtilitiesService.browse = function(system, term, callback) {

    var results = [];

    var regex = new RegExp('^' + (term ? term : '[^a-z]'), 'i');

    FileService.getFile('/data/' + system + '.json', function(err, titles) {
        if (err) {
            return callback(err);
        }

        async.each(Object.keys(titles), function(title, nexttitle) {

            if (title.match(regex)) {
                results.push({
                    system: system,
                    title: title,
                    file: titles[title].best
                });
            }
            nexttitle();

        }, function(err) {
            if (err) {
                return callback(err);
            }
            callback(null, results);
        });
    });
};

module.exports = SuggestionsService;
