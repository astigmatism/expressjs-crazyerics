
var fs = require('fs');
var async = require('async');
var config = require('../config.js');
var pako = require('pako');
var btoa = require('btoa');
var DataService = require('../services/data.js');

/**
 * UtilitiesService Constructor
 */
UtilitiesService = function() {
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

                var beginswith = new RegExp('^' + words[i],'i');                    //word is a whole or partial word at at the beginning of the result
                var wordinside = new RegExp('\\s' + words[i] + '(\\s|$)', 'i');     //word is a whole word someplace in the result (space or endstring after word)
                var partof     = new RegExp(words[i], 'i');                         //word is partial word anyplace in the result

                var termdepthscore = (words.length - i) * 10; //word path score gives highest score to first term in entry (most likely what user is searching for)

                //check each word against possible location in title and give score based on position
                //continue at each check to prevent same word scoring mutliple times
                if (title.match(beginswith)) {
                    searchscore += (300 + termdepthscore); //most points awarded to first word in query
                    continue;
                }
                if (title.match(wordinside)) {
                    searchscore += (200 + termdepthscore);
                    continue;
                }
                if (title.match(partof)) {
                    searchscore += (100 + termdepthscore);
                    continue;
                }
            }

            if (searchscore > 0) {

                //the one's digit is a score based on how many words the title's title is. The fewer, the beter the match given the terms
                var titlewords = title.split(' ');
                searchscore += (10 - titlewords.length);

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
 * takes a folder of single rom files and puts them in an appropriately named folder
 * this was important with some GoodMerged sets as unzipping some yielded in single files instead of a folder
 * for crazyerics we want to build search querys from the name of the game (its folder name) so this function
 * converts those files into game name folders
 * @param  {sting}   system
 * @param  {Function} callback
 * @return {}
 */
UtilitiesService.buildRomFolders = function(system, callback) {

    var result = {};

    //read all directory's from roms/system (each game is a dir)
    fs.readdir(__dirname + '/../public/' + system, function(err, games) {
        if (err) {
            callback(err);
        }

        async.each(games, function(game, nextgame) {

            //if the game begins with a ., then pass over (this is because of .DS_STORE)
            if (game.indexOf('.') === 0) {
                return nextgame();
            }

            //analyize file
            fs.stat(__dirname + '/../public/' + system + '/' + game, function (err, stats) {
                if (err) {
                    return nextgame();
                }

                //if file, handle this case with special functionality
                if (stats.isFile()) {

                    /*
                    remove the following:
                    - anything inside [] brackets and the brackets
                    - anything inside () as long as its one or two characters. This is meant to remove country codes but retain other good info like "(Unl)"
                    - the file extension! This one is a bit tricky, so I made it 2 or 3 characters after a "." and then end of line
                     */
                    var dirname = game.replace(/\..{2,3}$/i,'').replace(/\(.{1,2}\)/g,'').replace(/\[.*\]/g,''); 

                    console.log('File found in system directory: ' + game + ' ---> ' + dirname);

                    var newdir = __dirname + '/../public/' + system + '/' + dirname;
                    fs.mkdirSync(newdir);
                    fs.rename(__dirname + '/../public/' + system + '/' + game, newdir + '/' + game, function(err){
                        if(err) {
                            throw err;
                        }
                    });
                    return nextgame();
                }
            });

        }, function(err) {
            if (err) {
                return callback(err);
            }
            callback(null, result);
        });
    });
};

UtilitiesService.buildData = function(system, callback, exts) {

    var result = {};

    //read all directory's from roms/system (each game is a dir)
    fs.readdir(__dirname + '/../public/roms/' + system, function(err, titles) {
        if (err) {
            callback(err);
        }

        async.each(titles, function(title, nexttitle) {

            //if the title begins with a ., then pass over (this is because of .DS_STORE)
            if (title.indexOf('.') === 0) {
                return nexttitle();
            }

            //analyize file
            fs.stat(__dirname + '/../public/roms/' + system + '/' + title, function (err, stats) {
                if (err) {
                    return nexttitle();
                }

                //if file, mistake?
                if (stats.isFile()) {
                    console.log('File found in system directory: ' + title);
                    return nexttitle();
                }

                //if directory filled with roms as expected
                if (stats.isDirectory()) {

                    //create object for title
                    result[title] = {
                        best: '',         //key for files object which represents the best file suited for emulation play
                        files: {}
                    };

                    //open the title's directory and read each of the rom files
                    fs.readdir(__dirname + '/../public/roms/' + system + '/' + title, function(err, files) {
                        if (err) {
                            return nexttitle(err);
                        }

                        var details = UtilitiesService.findBestPlayableFile(files, exts);
                        
                        result[title].best = details.game;  //key into files maps which represents the best playable file

                        //get rank of each file
                        for (var j = 0; j < files.length; ++j) {
                            var details = UtilitiesService.findBestPlayableFile([files[j]], exts);
                            result[title].files[files[j]] = details.rank;
                        }

                        console.log(system + ' ' + title);

                        return nexttitle();
                    });
                }
            });

        }, function(err) {
            if (err) {
                return callback(err);
            }

            var path = __dirname + '/../data/' + system + '.json';
            fs.writeFile(path, JSON.stringify(result), function(error) {
                if (err) {
                    return callback(err);
                }
                callback(null, result);
            });
        });
    });
};

/**
 * Given an array of roms files, matches Good Roms data to find the most likely playable game
 * @param  {Array} files
 * @param {Array} exts array of allowable file extentions
 * @param {number} officialscore the score at which the game is considered an official release
 * @return {string}
 */
UtilitiesService.findBestPlayableFile = function(files, exts, officialscore) {

    //regular exp for region. order of importance. we're seeking a game which is probably in english
    var reRegion = {
        w:      new RegExp('\\(w\\)', 'ig'),        //World release
        u:      new RegExp('\\(u\\)', 'ig'),        //US region
        ju:     new RegExp('\\(ju\\)', 'ig'),       //Japanese and US release
        uj:     new RegExp('\\(uj\\)', 'ig'),       //Japanese and US release (alt)
        ue:     new RegExp('\\(ue\\)', 'ig'),       //Europe and US release
        eu:     new RegExp('\\(eu\\)', 'ig'),       //Europe and US release (alt)
        ub:     new RegExp('\\(ub\\)', 'ig'),       //Brazil and US
        ueb:    new RegExp('\\(ueb\\)', 'ig'),      //Brazil, Europe and US
        jub:    new RegExp('\\(jub\\)', 'ig'),      //Japan, Brazil and US
        jue:    new RegExp('\\(jue\\)', 'ig'),      //Japan, Europe and US
        jeb:    new RegExp('\\(jeb\\)', 'ig'),      //Japan, Brazil and Europe
        uk:     new RegExp('\\(uk\\)', 'ig'),       //UK release
        c:      new RegExp('\\(c\\)', 'ig'),        //Canada release
        a:      new RegExp('\\(a\\)', 'ig'),        //Ausrilia release
        eb:     new RegExp('\\(eb\\)', 'ig'),        //Europe and Brazil
        e:      new RegExp('\\(e\\)', 'ig'),        //Europe release (last ditch check as can be english sometimes)
        eng:    new RegExp('Eng', 'ig')             //English translation of japanese game. I'm putting this up here so that it DOES appear in suggestions and searches
    };

    //regions not in english are still important so that they arent ranked low
    var reRegion2 = {
        j:      new RegExp('\\(j\\)', 'ig'),        //japanese
    };


    var reOption = {
        p:      new RegExp('\\[!\\]', 'ig'),        //The ROM is an exact copy of the original game; it has not had any hacks or modifications.
        f:      new RegExp('\\[f\d?\\]', 'ig'),        //A fixed dump is a ROM that has been altered to run better on a flashcart or an emulator.
        b:      new RegExp('\\[', 'ig')
    };
    var i;
    var j;
    var re;

    //must additionally pass these incoming regex's as further arguments
    var reExtra = [];
    for (i = 0; i < exts.length; ++i) {
        reExtra.push(new RegExp('\.' + exts[i] + '$', 'gi'));
    }

    var result = null;      //the resulting file by name
    var resultindex = 0;    //the index of the resulting game in the "files" array
    var resultrank = 99;    //the current rank of the selection made

    //pass over all files. as soon as we find a successful match, break out and try the next file
    for (i = 0; i < files.length; ++i) {

        var item = files[i];
        var runningrank = 0;    //incrememnted on each check

        //first must pass only one of the extra regex's coming in (usually file ext)
        var pass = false;
        for (j = 0; j < reExtra.length; ++j) {
            if (item.match(reExtra[j])) {
                pass = true;
            }
        }
        if (!pass) {
            continue;
        }

        //pass over all english regions with playable [!] //99-83
        for (re in reRegion) {
            if (item.match(reRegion[re]) && item.match(reOption.p) && resultrank > runningrank) {
                result = item;
                resultindex = i;
                resultrank = runningrank;
            }
            ++runningrank;
        }

        //pass over all english regions, no brackets (82-66)
        for (re in reRegion) {
            if (item.match(reRegion[re]) && !item.match(reOption.b) && resultrank > runningrank) {
                result = item;
                resultindex = i;
                resultrank = runningrank;
            }
            ++runningrank;
        }

        //all non-english regions with playable [!] (65)
        for (re in reRegion2) {
            if (item.match(reRegion2[re]) && item.match(reOption.p) && resultrank > runningrank) {
                result = item;
                resultindex = i;
                resultrank = runningrank;
            }
            ++runningrank;
        }

        //pass over all non-english regions, no brackets (64)
        for (re in reRegion2) {
            if (item.match(reRegion2[re]) && !item.match(reOption.b) && resultrank > runningrank) {
                result = item;
                resultindex = i;
                resultrank = runningrank;
            }
            ++runningrank;
        }

        //has playable [!] with no matching region data (63)
        if (item.match(reOption.p) && resultrank > runningrank) {
            result = item;
            resultindex = i;
            resultrank = runningrank;
        }
        ++runningrank;


        //cut off box front art here, chances that anything lower won't have art is high

        //all english regions with fixed dump [f]
        for (re in reRegion) {
            if (item.match(reRegion[re]) && item.match(reOption.f) && resultrank > runningrank) {
                result = item;
                resultindex = i;
                resultrank = runningrank;
            }
            ++runningrank;
        }

        //all non-english regions with fixed dump [f]
        for (re in reRegion2) {
            if (item.match(reRegion[re]) && item.match(reOption.f) && resultrank > runningrank) {
                result = item;
                resultindex = i;
                resultrank = runningrank;
            }
            ++runningrank;
        }

        //all english regions
        for (re in reRegion) {
            if (item.match(reRegion[re]) && resultrank > runningrank) {
                result = item;
                resultindex = i;
                resultrank = runningrank;
            }
            ++runningrank;
        }

        //all non-english regions
        for (re in reRegion2) {
            if (item.match(reRegion2[re]) && resultrank > runningrank) {
                result = item;
                resultindex = i;
                resultrank = runningrank;
            }
            ++runningrank;
        }

        //no brackets
        if (!item.match(reOption.b) && resultrank > runningrank) {
            result = item;
            resultindex = i;
            resultrank = runningrank;
        }
        ++runningrank;
    }

    //if no matches, just take first item
    if (!result && files.length > 0) {
        result = files[0];
        resultindex = 0;
    }

    //if the game ranks with a [!] or higher (at this time 90), we assume an "offical" release. will help provide better searching
    return {
        game: result,
        index: resultindex,
        rank: (99 - resultrank)
    };
};

UtilitiesService.findSuggestionsAll = function(items, callback) {

    var aggrigation = [];

    // for debugging:
    // var totaltosuggest = 0;
    // for (system in config.data.systems) {
    //     totaltosuggest += config.data.systems[system].gamestosuggest;
    // }

    async.each(Object.keys(config.data.systems), function(system, nextsystem) {

        // for debugging:
        // var ratio = config.data.systems[system].gamestosuggest / totaltosuggest;
        var ratio = config.data.systems[system].ratiotoall;

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
};

UtilitiesService.findSuggestions = function(system, items, callback) {

    var results = [];
    var suggestions = [];

    DataService.getFile('/data/' + system + '.json', function(err, data) {
        if (err) {
            return callback(err);
        }

        //narrow down our list of random games to choose based on the theshold
        for (game in data) {
            //greater than the threshold 
            var bestfile = data[game].best;
            var bestrank = data[game].files[bestfile];
            if (bestrank >= config.data.search.suggestionThreshold) {
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

UtilitiesService.loadGame = function(system, title, file, callback) {

    var self = this;

    if (config && config.data && config.data.systems && config.data.systems[system]) {

        //load the actual game content. thanks to compressed with pako, the content is stored as a compressed string
        fs.readFile(__dirname + '/../public/roms/' + system + '/' + title + '/' + file, function(err, content) {
            if (err) {
                return callback(err);
            }
            callback(null, content);
        });
    } else {
        callback(system + ' is not found the config and is not a valid system');
    }

};

UtilitiesService.findGame = function(system, title, file, callback) {

    if (config && config.data && config.data.systems && config.data.systems[system]) {

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

    } else {
        callback(system + ' is not found the config and is not a valid system');
    }
};

UtilitiesService.collectDataForClient = function(req, openonload, callback) {

    var result = {
        retroarchconfig: {}
    };

    var synchonous = function() {
        //retroarch configs
        for (system in config.data.systems) {
            result.retroarchconfig[system] = config.data.systems[system].retroarchconfig;
        }

        //play history from session
        result.playhistory = {};
        if (req.session && req.session.games && req.session.games.history) {
            result.playhistory = req.session.games.history;
        }

        //because this json object is going over the wire, compress (client will decompress)
        result = UtilitiesService.compress.json(result);

        return callback(null, result);
    };

    if (openonload && openonload.title && openonload.system && openonload.file) {
        UtilitiesService.findGame(openonload.system, openonload.title, openonload.file, function(err, data) {
            if (err) {
                return callback(err);
            }
            result.openonload = data;
            synchonous();
        });
    } else {
        synchonous();
    }
};

UtilitiesService.setPlayHistory = function(req, system, title, file, add, callback) {

    if (req.session) {

        //ensure structure exists
        req.session.games = req.session.games ? req.session.games : {};
        req.session.games.history = req.session.games.history ? req.session.games.history : {};

        var numberToKeep = 10; //get this from config?
        var playHistory = req.session.games.history;

        //does this title already exist in the history?
        for (moment in playHistory) {
            if (playHistory[moment].title === title && playHistory[moment].system === system) {
                delete playHistory[moment];
                break;
            }
        }

        if (add) {
            playHistory[Date.now()] = {
                system: system,
                title: title,
                file: file
            }
        }

        //trim history?
        var keys = Object.keys(playHistory);

        if (keys.length > numberToKeep) {
            keys.sort(function(a, b) {
                return a < b;
            });
            keys = keys.slice(0, numberToKeep);
            var newHistory = {};
            for (var i = 0; i < keys.length; ++i) {
                newHistory[keys[i]] = playHistory[keys[i]];
            }
            playHistory = newHistory;
        }

        req.session.games.history = playHistory;
    }
    callback(null, playHistory);

};

UtilitiesService.compress = {
    json: function(json) {
        return btoa(pako.deflate(JSON.stringify(json), { to: 'string' }));
    }
};


module.exports = UtilitiesService;
