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
recipe : {
    systems: [nes, snes, gen],  //null indicates all systems
    proportion: [40, 20, 40],   //percentage of system representation in total. null will use proportion of total of boxes for this system vs other systems
    set: [0, 0, 0],             //enum: see below
    count: 100,                 //the number of results to return
}

set:
0: use the "top suggestions" set only
1: use result from the "above system threshold" only. this usually means the boxart is us (not j or e)
2: use results from both above and below the system threshold. basically all boxart avaiable
3: use results from below the system threshold only. strange, but possible :)

*/

SuggestionsService.Get = function(recipe, callback) {

    //firstly, determine which cache to pull. we have suggestions for systems, and a separate cache for all suggestions 
    //(because we dont want to pull cache over and over for all systems)
    PullCache(recipe, function(err, caches) {


    });

};

SuggestionsService.PullCache = function(recipe, callback) {

    var caches = {};

    if (recipe.hasOwnProperty('systems') && recipe.systems !== null) {

        //pull cache for each system
        async.each(recipe.systems, function(system, nextsystem) {

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
    }
    else {

        FileService.getCache('suggestions.' + system, function(err, cache) {
            if (err) {
                return callback(err);
            }
            caches.all = cache;
            callback(null, caches);
        });
    }
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
