
var fs = require('fs');
var async = require('async');
var config = require('../config.js');
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
UtilitiesService.search = function(system, term, maximum, callback) {

    maximum = maximum || 20; //return 20 results unless otherwise stated
    term = term || '';
    term = term.replace(/\s+/g,' ').trim().replace(/[^a-zA-Z0-9\s]/gi,''); //sanitize term by trimming, removing invalid characters
    var result = [];
    var i;
    var game;
    var words = term.split(' '); //split all search terms

    DataService.getFile('/data/' + system + '/search.json', function(err, data) {
        if (err) {
            return callback(err);
        }

        //pass over all entries just once
        for (game in data) {

            /**
             * search scoring
             * hundreds digit: the strength of the regex scoring
             * tens digit: the order of the search query words (first is more relevant)
             * ones digit: the length of the game's title. a smaller title more closely matches the search making it more revelant
             * precision: the playability score of the game. this elevates games that are (U) and [!] over ones that are hacks etc.
             */
            //the higher the search score, the more likely it is to show at the top of the auto complete list
            var searchscore = 0;

            //pass over all search terms
            for (i = 0; i < words.length; ++i) {

                var beginswith = new RegExp('^' + words[i],'i');                    //word is a whole or partial word at at the beginning of the result
                var wordinside = new RegExp('\\s' + words[i] + '($|\\s)', 'i');     //word is a whole word someplace in the result (space either side or line end)
                var partof     = new RegExp(words[i], 'i');                         //word is partial word anyplace in the result

                var termdepthscore = (words.length - i) * 10; //word path score gives highest score to first term in entry (most likely what user is searching for)

                //check each word against possible location in game and give score based on position
                //continue at each check to prevent same word scoring mutliple times
                if (game.match(beginswith)) {
                    searchscore += (300 + termdepthscore); //most points awarded to first work in query
                    continue;
                }
                if (game.match(wordinside)) {
                    searchscore += (200 + termdepthscore); //most points awarded to first work in query
                    continue;
                }
                if (game.match(partof)) {
                    searchscore += (100 + termdepthscore); //most points awarded to first work in query
                    continue;
                }
            }

            if (searchscore > 0) {

                //the one's digit is a score based on how many words the game's title is. The fewer, the beter the match given the terms
                var gamewords = game.split(' ');
                searchscore += (10 - gamewords.length);

                //the decimal places in the score represent the "playability" of the game. This way, games with (U) and [!] will rank higher than those that are hacks or have brackets
                searchscore += (data[game].r * 0.1); //between 9.9 and 0.0

                result.push([game, data[game].g, data[game].s || system, searchscore]);
            }
        }

        //return result; //use for debugging all results

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

    //when regex strings attached to end, group them for use later
    var args = [];
    for (i = 2; i < arguments.length; ++i) {
        args.push(arguments[i]);
    }

    //read all directory's from roms/system (each game is a dir)
    fs.readdir(__dirname + '/../public/roms/' + system, function(err, games) {
        if (err) {
            callback(err);
        }

        async.each(games, function(game, nextgame) {

            //if the game begins with a ., then pass over (this is because of .DS_STORE)
            if (game.indexOf('.') === 0) {
                return nextgame();
            }

            //analyize file
            fs.stat(__dirname + '/../public/roms/' + system + '/' + game, function (err, stats) {
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

                    var newdir = __dirname + '/../public/roms/' + system + '/' + dirname;
                    fs.mkdirSync(newdir);
                    fs.rename(__dirname + '/../public/roms/' + system + '/' + game, newdir + '/' + game, function(err){
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

/**
 * build system's search.json
 * @param  {string}   system
 * @param  {Function} callback
 * @return {}
 */
UtilitiesService.buildSearch = function(system, callback) {

    var result = {};            //all games ranked
    var officialrelease = {};   //only games which rank with a [!]

    //when regex strings attached to end, group them for use later
    var args = [];
    for (i = 2; i < arguments.length; ++i) {
        args.push(arguments[i]);
    }

    //read all directory's from roms/system (each game is a dir)
    fs.readdir(__dirname + '/../public/roms/' + system, function(err, games) {
        if (err) {
            callback(err);
        }

        async.each(games, function(game, nextgame) {

            //if the game begins with a ., then pass over (this is because of .DS_STORE)
            if (game.indexOf('.') === 0) {
                return nextgame();
            }

            //analyize file
            fs.stat(__dirname + '/../public/roms/' + system + '/' + game, function (err, stats) {
                if (err) {
                    return nextgame();
                }

                //if file, mistake?
                if (stats.isFile()) {
                    console.log('File found in system directory: ' + game + ' ---> ' + dirname);
                    return nextgame();
                }

                //if directory filled with roms as expected
                if (stats.isDirectory()) {

                    result[game] = {}; //create object for game

                    //open the game's directory and read each of the rom files
                    fs.readdir(__dirname + '/../public/roms/' + system + '/' + game, function(err, roms) {
                        if (err) {
                            return nextgame(err);
                        }
                        
                        var details = UtilitiesService.findBestPlayableGame.apply(UtilitiesService, [roms].concat(args)); //returns index of playable game returns object with "game", "index" and "rank"

                        //for detailed results in debugging
                        // result[game] = {
                        //     roms: roms,
                        //     game: details.game,
                        //     index: details.index,
                        //     rank: details.rank
                        // }

                        result[game] = {
                            g: details.game,
                            r: details.rank
                        };

                        if (details.official) {
                            officialrelease[game] = {
                                g: details.game,
                                r: details.rank
                            };
                        }

                        return nextgame();
                    });
                }
            });

        }, function(err) {
            if (err) {
                return callback(err);
            }

            var path = __dirname + '/../data/' + system + '/search.json';
            var path2 = __dirname + '/../data/' + system + '/searchofficial.json';

            fs.writeFile(path, JSON.stringify(result), function(error) {
                if (err) {
                    return callback(err);
                }
                fs.writeFile(path2, JSON.stringify(officialrelease), function(error) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, 'File ' + path + ' and ' + path2 + ' written')
                });
            });
        });
    });
};

/**
 * builds system games.json file
 * @param  {string}   system
 * @param  {Function} callback
 * @return {}
 */
UtilitiesService.buildGames = function(system, callback) {

    var result = {};

    //when regex strings attached to end, group them for use later
    var args = [];
    for (i = 2; i < arguments.length; ++i) {
        args.push(arguments[i]);
    }

    //read all directory's from roms/system (each game is a dir)
    fs.readdir(__dirname + '/../public/roms/' + system, function(err, games) {
        if (err) {
            callback(err);
        }

        async.each(games, function(game, nextgame) {

            //if the game begins with a ., then pass over (this is because of .DS_STORE)
            if (game.indexOf('.') === 0) {
                return nextgame();
            }

            //analyize file
            fs.stat(__dirname + '/../public/roms/' + system + '/' + game, function (err, stats) {
                if (err) {
                    return nextgame();
                }

                //if file, mistake?
                if (stats.isFile()) {
                    console.log('File found in system directory: ' + game);
                    return nextgame();
                }

                //if directory filled with roms as expected
                if (stats.isDirectory()) {

                    result[game] = {}; //create object for game

                    //open the game's directory and read each of the rom files
                    fs.readdir(__dirname + '/../public/roms/' + system + '/' + game, function(err, roms) {
                        if (err) {
                            return nextgame(err);
                        }

                        for (var j = 0; j < roms.length; ++j) {
                            var arr = [[roms[j]]];
                            var details = UtilitiesService.findBestPlayableGame.apply(UtilitiesService, arr.concat(args));

                            result[game][roms[j]] = details.rank;
                        }

                        return nextgame();
                    });
                }
            });

        }, function(err) {
            if (err) {
                return callback(err);
            }

            var path = __dirname + '/../data/' + system + '/games.json';
            fs.writeFile(path, JSON.stringify(result), function(error) {
                if (err) {
                    return callback(err);
                }
                callback(null, 'File ' + path + ' written')
            });
        });
    });
};

/**
 * Given an array of roms files, matches Good Roms data to find the most likely playable game
 * @param  {Array} files
 * @param  {string} all additional arguments are regex strings that require passing
 * @return {string}
 */
UtilitiesService.findBestPlayableGame = function(files) {

    //regular exp for region. order of importance. we're seeking a game which is probably in english
    var reRegion = {
        u:      new RegExp('\\(u\\)', 'ig'),        //US region
        ju:     new RegExp('\\(ju\\)', 'ig'),       //Japanese and US release
        uj:     new RegExp('\\(uj\\)', 'ig'),       //Japanese and US release (alt)
        ue:     new RegExp('\\(ue\\)', 'ig'),       //Europe and US release
        eu:     new RegExp('\\(eu\\)', 'ig'),       //Europe and US release (alt)
        w:      new RegExp('\\(w\\)', 'ig'),        //World release
        uk:     new RegExp('\\(uk\\)', 'ig'),       //UK release
        c:      new RegExp('\\(c\\)', 'ig'),        //Canada release
        a:      new RegExp('\\(a\\)', 'ig'),        //Ausrilia release
        e:      new RegExp('\\(e\\)', 'ig'),        //Europe release (last ditch check as can be english sometimes)
        eng:    new RegExp('Eng', 'ig'),            //English translation
        j:      new RegExp('\\(j\\)', 'ig')         //so sometimes a japanese relese IS important because we don't want it ranking as long as a hacked game
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
    for (i = 1; i < arguments.length; ++i) {
        reExtra.push(new RegExp(arguments[i], 'gi'));
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

        //pass over all regions, check playable
        for (re in reRegion) {
            if (item.match(reRegion[re]) && item.match(reOption.p) && resultrank > runningrank) {
                result = item;
                resultindex = i;
                resultrank = runningrank;
            }
            ++runningrank;
        }

        //playable (9)
        if (item.match(reOption.p) && resultrank > runningrank) {
            result = item;
            resultindex = i;
            resultrank = runningrank;
        }
        ++runningrank;

        //pass over all regions, no brackets
        for (re in reRegion) {
            if (item.match(reRegion[re]) && !item.match(reOption.b) && resultrank > runningrank) {
                result = item;
                resultindex = i;
                resultrank = runningrank;
            }
            ++runningrank;
        }

        //all regions with fixed dump [f]
        for (re in reRegion) {
            if (item.match(reRegion[re]) && item.match(reOption.f) && resultrank > runningrank) {
                result = item;
                resultindex = i;
                resultrank = runningrank;
            }
            ++runningrank;
        }

        //all regions
        for (re in reRegion) {
            if (item.match(reRegion[re]) && resultrank > runningrank) {
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

    //if the game ranks with a [!] or higher (at this time 87), we assume an "offical" release. will help provide better searching
    return {
        game: result,
        index: resultindex,
        rank: (99 - resultrank),
        official: ((99 - resultrank) > 89)
    };
};

UtilitiesService.findSuggestionsAll = function(items, callback) {

    var aggrigation = [];
    var systems = Object.keys(config.data.systems);

    async.each(systems, function(system, nextsystem) {

        UtilitiesService.findSuggestions(system, (items / systems.length), function(err, suggestions) {
            if (err) {
                return nextsystem(err);
            }
            for (var i = 0; i < suggestions.length; ++i) {
                aggrigation.push({
                    t: suggestions[i].t,
                    g: suggestions[i].g,
                    r: suggestions[i].r,
                    s: system
                });
            }
            nextsystem();
        });

    }, function(err) {
        if (err) {
            callback(err);
        }

        //randomize 
        aggrigation = UtilitiesService.shuffle(aggrigation);

        callback(null, aggrigation);
    });
};

UtilitiesService.findSuggestions = function(system, items, callback) {

    var results = [];

    DataService.getFile('/data/' + system + '/searchofficial.json', function(err, data) {
        if (err) {
            return callback(err);
        }
        var games = Object.keys(data);
        
        //run over all games
        for (var i = 0; i < items; ++i) {
            
            //randomly select a game
            var randomgame = games[games.length * Math.random() << 0];
                
            //in the result, use the game as the key and its values the file and rank
            results.push({
                t: randomgame,
                g: data[randomgame].g,
                r: data[randomgame].r,
                s: system
            });
        }
        callback(null, results);
    });
};  

module.exports = UtilitiesService;
