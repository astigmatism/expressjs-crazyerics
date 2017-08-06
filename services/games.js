var async = require('async');
var config = require('config');
var FileService = require('../services/files.js');
var UtilitiesService = require('../services/utilities.js');
var TitlesSQL = require('../db/titles.js');
var FilesSQL = require('../db/files.js');

GameService = function() {
};

//a play request is initiated, update game tables, return game details...
GameService.PlayRequest = function(gameKey, callback) {

    //ensure the 

    //break this down into meaningful values ;)
    var game = UtilitiesService.decompress.json(gameKey);

    //ensures title and file exist in backend
    GameService.Exists(game.system, game.title, game.file, (err, titleRecord, fileRecord) => {
        if (err) {
            return callback(err);
        }

        //update files table
        GameService.PlayFile(fileRecord.file_id, (err, fileUpdateRecord) => {
            if (err) {
                return callback(err);
            }

            //get details from file system (cached). data from romsort project
            GameService.GetGameDetails(game.system, game.title, game.file, (err, details) => {
                if (err) {
                    return callback(err);
                }
                callback(null, titleRecord, fileRecord, details);
            });
        });
    });

};

//ensures the creation of an entry in the title table. there's no need to create it until a user interacts with a game
GameService.Exists = function(system, title, file, callback) {

    TitlesSQL.GetTitle(system, title, (err, titleRecord) => {
        if (err) {
            return callback(err);
        }

        FilesSQL.GetFile(titleRecord.title_id, file, (err, fileRecord) => {
            if (err) {
                return callback(err);
            }
            callback(null, titleRecord, fileRecord);
        });
    });
};

GameService.PlayFile = function(fileId, callback) {
    FilesSQL.PlayFile(fileId, (err, fileUpdateResult) => {
        if (err) {
            return callback(err);
        }
        callback(null, fileUpdateResult);
    })
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
