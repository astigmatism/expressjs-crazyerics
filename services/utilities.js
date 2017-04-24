
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

                            //top suggestions
                            if (boxartdata[title].hasOwnProperty('ts')) {

                                //add to all suggestions
                                suggestionsall[system].top.push(title);
                                suggestionsall[system].data[title] = data[title];

                                //add to system suggestions
                                suggestions.top.push(title);
                                suggestions.data[title] = data[title];
                            }
                            
                            //ok, now separate the remianing suggestions in two buckets: best and foreign (remaining)
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

/**
 * Given a search term, searches and returns the most valid games
 * @param  {string} system
 * @param  {string} term
 * @param  {number} maximum number of results returned
 * @return {Array}
 */
UtilitiesService.search = function(systemfilter, term, maximum, callback) {

    maximum = maximum || 20; //return 20 results unless otherwise stated
    term = term || '';
    term = term.replace(/\s+/g,' ').trim().replace(/[^a-zA-Z0-9\s]/gi,''); //sanitize term by trimming, removing invalid characters
    var result = [];
    var i;
    var system;
    var file;
    var rank;
    var words = term.split(' '); //split all search terms

    FileService.getFile('/data/' + systemfilter + '.json', function(err, data) {
        if (err) {
            return callback(err);
        }

        //pass over all titles just once
        for (title in data) {

            //var log = ''; //for debugging scores of results. please include in result

            //edge case for "all" searches - the file is in a different format
            if (systemfilter === 'all') {
                system = data[title].system;
                file = data[title].file;
                rank = data[title].rank;
                //we append the system name to the title name for unique enries (ie "Sonic the Hedgehog" exists twice and we can't use it as a key without its system name)
                title = title.replace(new RegExp('\.' + system + '$', 'gi'),'');
            
            } else {
                system = systemfilter;
                file = data[title].best;
                rank = data[title].files[file];
            }

            /**
             * search scoring
             * hundreds digit: the strength of the regex scoring
             * tens digit: the order of the search query words (first is more relevant)
             * ones digit: the length of the title's title. a smaller title more closely matches the search making it more revelant
             * precision: the playability score of the title. this elevates titles that are (U) and [!] over ones that are hacks etc.
             */
            //the higher the search score, the more likely it is to show at the top of the auto complete list
            var searchscore = 0;

            //pass over all search terms
            for (i = 0; i < words.length; ++i) {

                var titlewords = title.split(' '); //split title's terms

                var wholeterm = new RegExp('^' + words[i] + '(\\s|$)','i');        //word is a whole word at at the beginning of the result
                var wordinside = new RegExp('\\s' + words[i] + '(\\s|$)', 'i');     //word is a whole word someplace in the result (space or endstring after word)
                var beginswith = new RegExp('(^|\\s)' + words[i],'i');              //is a partial word at at the beginning of the result or one of the words within
                var partof     = new RegExp(words[i], 'i');                         //word is partial word anyplace in the result

                var termdepthscore = (words.length - i) * 10; //word path score gives highest score to first term in entry (most likely what user is searching for)

                //check each word against possible location in title and give score based on position
                //continue at each check to prevent same word scoring mutliple times
                if (title.match(wholeterm)) {
                    searchscore += (300 + termdepthscore); //most points awarded to first word in query
                    //log += words[i] + '=' + (300 + termdepthscore) + ' wholeterm (' + termdepthscore + '). ';
                    continue;
                }
                if (title.match(wordinside)) {
                    
                    var  wordinsidescore = 200;

                    //ok, which whole word inside title? more depth determines score
                    for (var j = 0; j < titlewords.length; ++j) {
                        if (words[i].toLowerCase() === titlewords[j].toLowerCase()) {
                            wordinsidescore -= (10 * j);
                        }
                    }

                    searchscore += (wordinsidescore + termdepthscore);
                    //log += words[i] + '=' + (wordinsidescore + termdepthscore) + ' wordinside (' + termdepthscore + '). ';
                    continue;
                }
                if (title.match(beginswith) && !title.match(wholeterm)) {
                    
                    var beginswithscore = 150;

                    //ok, which word inside title? more depth lessens score
                    for (var j = 0; j < titlewords.length; ++j) {
                        var match = new RegExp(words[i],'i');
                        if (titlewords[j].match(match)) {
                            beginswithscore -= (10 * j);
                        }
                    }

                    searchscore += (beginswithscore + termdepthscore);
                    //log += words[i] + '=' + (beginswithscore + termdepthscore) + ' beginswith (' + termdepthscore + '). ';
                    continue;
                }
                if (title.match(partof)) {
                    searchscore += (100 + termdepthscore);
                    //log += words[i] + '=' + (100 + termdepthscore) + ' partof (' + termdepthscore + '). ';
                    continue;
                }
            }

            if (searchscore > 0) {

                //the one's digit is a score based on how many words the title's title is. The fewer, the beter the match given the terms
                searchscore += (10 - titlewords.length);
                //log += 'title penalty: ' + (10 - titlewords.length) + '. ';

                //the decimal places in the score represent the "playability" of the title. This way, titles with (U) and [!] will rank higher than those that are hacks or have brackets
                searchscore += (rank * 0.1); //between 9.9 and 0.0

                result.push([title, file, system, searchscore]);
            }
        }

        //sort according to score
        result.sort(function(a, b) {
            if (a[3] > b[3]) {
                return -1;
            }
            if (a[3] < b[3]) {
                return 1;
            }
            return 0;
        });

        //if over max, splice out
        if (result.length > maximum) {
            result.splice(maximum, result.length - 1);
        }

        return callback(null, result);
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

/**
 * Getting suggestions for all system involves a custom routine which uses the cache we built on the start of the app which contains
 * a json object of all suggestable games for all systems. It is pretty heavyweight but better than openning each system suggestions
 * cache file individually. We evenly take suggestions from each system based on the overall number of suggestions that system has to
 * offer
 * @param  {number}   items    the number of suggestions to return
 * @param  {Function} callback
 * @return {undef}
 */
UtilitiesService.findSuggestionsAll = function(items, callback) {

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
UtilitiesService.findSuggestions = function(system, items, forgienMixPerc, callback) {

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
