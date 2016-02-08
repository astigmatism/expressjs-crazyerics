
var fs = require('fs');
var async = require('async');
var config = require('config');
var pako = require('pako');
var btoa = require('btoa');
var atob = require('atob');
var merge = require('merge');
var DataService = require('../services/data.js');

/**
 * UtilitiesService Constructor
 */
UtilitiesService = function() {
};

UtilitiesService.onApplicationStart = function(callback) {

    //put into cache all the data files
    var systems = config.get('systems');
    var search = {};
    var counts = {
        'all': {
            'suggestions': 0,
            'titles': 0
        }
    };
    

    async.each(Object.keys(systems), function(system, nextsystem) {

        DataService.getFile('/data/' + system + '.json', function(err, data) {
            if (err) {
                console.log('Could not find data file for ' + system + ' even though they are defined in config');
                return nextsystem();
            }

            counts[system] = {
                'suggestions': 0,
                'titles': 0
            };

            //ok, let's build the all.json file with the data from each file
            for (var title in data) {

                var bestfile = data[title].best;
                var bestrank = data[title].files[bestfile];

                //if the rank of the best playable file for the title us above the threshold for acceptable suggestion
                if (bestrank >= config.get('search').suggestionThreshold) {
                    ++counts[system]['suggestions'];
                    ++counts['all']['suggestions'];
                }

                //if the rank of the best playable file for the titel is above the threshold for part of all-console search
                if (bestrank >= config.get('search').searchAllThreshold) {
                    search[title + '.' + system] = {
                        system: system,
                        file: bestfile,
                        rank: bestrank
                    };
                }
                ++counts[system]['titles'];
                ++counts['all']['titles'];
            }

            nextsystem();
        });

    }, function(err) {
        if (err) {
            return callback(err);
        }

        DataService.setCache('counts', counts, 0, function() {
            
            //at the end, let's write an all.json data file to cache
            //use the same key as if it were a file (it used to be)
            DataService.setCache('/data/all.json', search, 0, function() {

                callback();
            }); 
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

    DataService.getFile('/data/' + systemfilter + '.json', function(err, data) {
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

UtilitiesService.findSuggestionsAll = function(items, callback) {

    var aggrigation = [];
    var systems = config.get('systems');

    DataService.getCache('counts', function(err, systems) {

        async.each(Object.keys(systems), function(system, nextsystem) {

            if (system == 'all') {
                return nextsystem();
            }

            //the ratio of suggestable titles of this system to all titles playable
            var ratio = systems[system]['suggestions'] / systems['all']['suggestions'];

            //how many of the items to suggest overall should be from this system?
            var tosuggest = (ratio * items);

            UtilitiesService.findSuggestions(system, tosuggest, function(err, suggestions) {
                if (err) {
                    return nextsystem(err);
                }
                for (var i = 0; i < suggestions.length; ++i) {
                    aggrigation.push({
                        system: system,
                        title: suggestions[i].title,
                        file: suggestions[i].file
                    });
                }
                nextsystem();
            });
        }, function(err) {
            if (err) {
                return callback(err);
            }

            //retain original amount (possible to go over because we found suggests as items / systems.length)
            aggrigation = aggrigation.slice(0, items);

            //randomize 
            aggrigation = UtilitiesService.shuffle(aggrigation);

            callback(null, aggrigation);
        });
    });
};

UtilitiesService.findSuggestions = function(system, items, callback) {

    var results = [];
    var suggestions = [];
    var search = config.get('search');

    //this got cached on app start
    DataService.getFile('/data/' + system + '.json', function(err, data) {
        if (err) {
            return callback(err);
        }

        //narrow down our list of random games to choose based on the theshold
        for (game in data) {
            //greater than the threshold 
            var bestfile = data[game].best;
            var bestrank = data[game].files[bestfile];
            if (bestrank >= search.suggestionThreshold) {
                suggestions.push(game);
            }
        }
        
        //run over all games
        for (var i = 0; i < items; ++i) {            

            //randomly select a game
            var randomgame = suggestions[suggestions.length * Math.random() << 0];
                
            //in the result, use the game as the key and its values the file and rank
            results.push({
                system: system,
                title: randomgame,
                file: data[randomgame].best
            });
        }
        callback(null, results);
    });
};  

UtilitiesService.findGame = function(system, title, file, callback) {

    DataService.getFile('/data/' + system + '.json', function(err, games) {
        if (err) {
            return callback(err);
        }

        if (games[title] && games[title].files[file]) {

            return callback(null, {
                system: system,
                title: title,
                file: file,
                files: games[title].files
            });

        }
        return callback(title + ' not found for ' + system + ' or ' + file + ' not found in ' + title);
    });
};

UtilitiesService.collectDataForClient = function(req, openonload, callback) {

    var playerdata = {};

    var configdata = {
        retroarch: {},
        rompath: {},
        flatten: {},
        recommendedshaders: {},
        autocapture: {}
    };
    var systems = config.get('systems');
    var retroarch = config.get('retroarch');

    //system specific configs
    for (system in systems) {
        configdata.retroarch[system] = retroarch + systems[system].retroarch;
        configdata.recommendedshaders[system] = systems[system].recommendedshaders;
        configdata.autocapture[system] = systems[system].autocapture;
    }
    //roms location
    configdata.rompath = config.get('rompath');

    //are rom dirtree structures flattened? (use gamekey as file name)
    configdata.flattenedromfiles = config.get('flattenedromfiles');

    //asset location
    configdata.assetpath = config.get('assetpath');

    //shader manifest
    configdata.shaders = config.get('shaders');

    //box art location
    configdata.boxpath = config.get('boxpath');
    configdata.flattenedboxfiles = config.get('flattenedboxfiles');

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

UtilitiesService.compressShaders = function(name, path, callback) {

    var result = {};

    fs.readdir(path, function(err, items) {
        if (err) {
            return callback(err);
        }

        async.each(items, function(item, nextitem) {

            //analyize file
            fs.stat(path + '/' + item, function (err, stats) {
                if (err) {
                    return nextitem(err);
                }

                //files only
                if (stats.isFile()) {

                    fs.readFile(path + '/' + item, function(err, content) {
                        if (err) {
                            return nextitem(err);
                        }

                        //dumb DS_Store
                        if (item !== '.DS_Store') {
                            result[item] = UtilitiesService.compress.bytearray(content);
                        }

                        return nextitem();
                    });
                }
            });

        }, function(err) {
            if (err) {
                return callback(err);
            }

            //write result to file using name parameter
            fs.writeFile(__dirname + '/../data/shaders/' + name + '.json', JSON.stringify(result), 'utf8', function(err) {
                if (err) {
                    return callback(err);
                }
                callback(null, 'file saved.');
            });
        });
    });
};

//load a shader file with a given file name or key. if key not a string or zero length, no prob, just send back empty data
//error case unique: if no any reason we cant load the file or no key is given, return a zero length string
UtilitiesService.getShader = function(key, callback) {

    DataService.getFile('/data/shaders/' + key + '.json', function(err, content) {
        if (err) {
            return callback(err);
        }
        return callback(null, content);
    });
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
