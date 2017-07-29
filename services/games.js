var async = require('async');
var config = require('config');
var GamesModel = require('../models/games');
var FileService = require('../services/fileservice.js');
var UtilitiesService = require('../services/utilities.js');
//mongoose: http://mongoosejs.com/docs/api.html

GameService = function() {
};

//a play request is initiated, update game tables, return game details...
GameService.PlayRequest = function(gameKey, callback) {

    //break this down into meaningful values ;)
    var game = UtilitiesService.decompress.json(gameKey);

    GameService.Exist(game.system, game.title, game.file, (err, result) => {
        if (err) {
            return callback(err);
        }
        
        GameService.IncrementPlayCount(game.system, game.title, game.file, (err) => {
            if (err) {
                return callback(err);
            }

            GameService.GetGameDetails(game.system, game.title, game.file, (err, details) => {
                if (err) {
                    return callback(err);
                }
                callback(null, details);
            });
        });
    });


};

//ensures the creation of an entry in the game table. there's no need to create it until a user interacts with a game
GameService.Exist = function(system, title, file, callback) {

    GamesModel.findOneAndUpdate({
        system: system,
        title: title
    }, {}, { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
    }, (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

GameService.IncrementPlayCount = function(system, title, file, callback) {

    // GamesModel.findOneAndUpdate({
    //     'system': system,
    //     'title': title,
    //     'files.name':  UtilitiesService.compress.string(file),
    // }, {
    //     files: { '$.lastPlayed': Date.now() },
    //     $inc: {
    //         files: { '$.playCount': 1 }
    //     }
    // }, (err, result) => {
    //     if (err) {
    //         return callback(err);
    //     }
    //     callback(null, result);
    // });

    //in the end it was just easier to get the document and then save it back
    GamesModel.findOne({
        'system': system,
        'title': title,
    })
    .exec((err, result) => {
        
        //files have dots in their name and mongo cannot store that
        var cFile = UtilitiesService.compress.string(file);

        if (!result.files.hasOwnProperty(cFile)) {
            result.files[cFile] = {
                lastPlayed: Date.now(),
                playCount: 0
            }
        }

        result.files[cFile].lastPlayed = Date.now();
        result.files[cFile].playCount += 1;

        if (result.files.length > 0) {
            result.files[0].lastPlayed = Date.now();
            result.files[0].playCount += 1;

            result.save((err, result) => {
                if (err) {
                    return callback(err);
                }
                callback(null, result);
            });
        }
        else {
            return callback('GameService.IncrementPlayCount: Result not formatted correcty.', result)
        }
    });
};

//this function returns all details given a system and a title. must be exact matches to datafile!
//also returns hasboxart flag and any info (ripped from thegamesdb)
GameService.GetGameDetails = function(system, title, file, callback) {

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
            info: null,
            size: null
        };

        //open data file for details
        FileService.getFile('/data/' + system + '_master', function(err, masterFile) {
            if (err) {
                return callback(err);
            }

            //if title found in datafile.. we can find data anywhere since all data is constructed from the original datafile!
            if (masterFile[title] && masterFile[title].f[file]) {

                data.system = system;
                data.title = title;
                data.file = file;
                data.files = masterFile[title].f;

                //is there box art too?
                FileService.getFile('/data/' + system + '_boxart', function(err, boxartgames) {
                    if (err) {
                        //no need to trap here
                    } else {

                        if (boxartgames[title]) {
                            data.boxart = boxartgames[title];
                        }
                    }

                    //get filesize so we have calc download progress
                    FileService.getFile('/data/' + system + '_filedata', function(err, filedata) {
                        if (err) {
                            //no need to trap here
                            console.log(err);
                        } else {

                            //the compressed file name matches the cdnready (or file uploaded to dropbox) filename
                            var compressedFileName = UtilitiesService.compress.string(title + file);
                            var compressedFileName = encodeURIComponent(compressedFileName);

                            if (filedata[compressedFileName] && filedata[compressedFileName].s) {
                                data.size = filedata[compressedFileName].s;
                            }
                        }

                        
                        //is there info?
                        FileService.getFile('/data/' + system + '_thegamesdb', function(err, thegamesdb) {
                            if (err) {
                                console.log(err);
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
                });

            } else {
                return callback('title: "' + title + '" not found for ' + system + ' or file: "' + file + '" not found in title folder: "' + title + '"');
            }
        });

    });
};

module.exports = GameService;
