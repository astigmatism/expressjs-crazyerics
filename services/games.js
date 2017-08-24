'use strict';
const async = require('async');
const config = require('config');
const FileService = require('../services/files.js');
const UtilitiesService = require('../services/utilities.js');
const TitlesSQL = require('../db/titles.js');
const FilesSQL = require('../db/files.js');
const Cache = require('../services/cache');
const NodeCache = require('node-cache');

//define custom cache for files
const GamesCache = new Cache('games.$1', new NodeCache({
        stdTTL: 0,                      //0 = unlimited. 
        checkperiod: 0                  //0 = no periodic check
    })
);

module.exports = new (function() {

    var _self = this;

    //a play request is initiated, update game tables, return game details...
    this.PlayRequest = function(gameKey, callback) {

        //ensure the 

        //break this down into meaningful values ;)
        var game = UtilitiesService.Decompress.json(gameKey);

        //ensures title and file exist in backend
        _self.Exists(game.system, game.title, game.file, (err, titleRecord, fileRecord) => {
            if (err) {
                return callback(err);
            }

            //update files table
            _self.PlayFile(fileRecord.file_id, (err, fileUpdateRecord) => {
                if (err) {
                    return callback(err);
                }

                //get details from file system (cached). data from romsort project
                _self.GetGameDetails(game.system, game.title, game.file, (err, details) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, titleRecord, fileRecord, details);
                });
            });
        });
    };

    //ensures the creation of an entry in the title table. there's no need to create it until a user interacts with a game
    this.Exists = function(system, title, file, callback) {

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

    this.PlayFile = function(fileId, callback) {
        FilesSQL.PlayFile(fileId, (err, fileUpdateResult) => {
            if (err) {
                return callback(err);
            }
            callback(null, fileUpdateResult);
        })
    };

    //this function returns all details given a system and a title. must be exact matches to datafile!
    //also returns hasboxart flag and any info (ripped from thegamesdb)
    this.GetGameDetails = function(system, title, file, callback) {

        //I found it faster to save all the results in a cache rather than load all the caches to create the result.
        //went from 120ms response to about 30ms
        var cacheKey = system + '.' + title + '.' + file;
        GamesCache.Get([cacheKey], (err, data) => {
            if (err) {
                return callback(err);
            }

            //if already built, use cache
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
            FileService.Get('/data/' + system + '_master', function(err, masterFile) {
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
                    FileService.Get('/data/' + system + '_boxart', function(err, boxartgames) {
                        if (err) {
                            //no need to trap here
                        } else {

                            if (boxartgames[title]) {
                                data.boxart = boxartgames[title];
                            }
                        }

                        //get filesize so we have calc download progress
                        FileService.Get('/data/' + system + '_filedata', function(err, filedata) {
                            if (err) {
                                //no need to trap here
                                console.log(err);
                            } else {

                                //the compressed file name matches the cdnready (or file uploaded to dropbox) filename
                                var compressedFileName = UtilitiesService.Compress.string(title + file);
                                var compressedFileName = encodeURIComponent(compressedFileName);

                                if (filedata[compressedFileName] && filedata[compressedFileName].s) {
                                    data.size = filedata[compressedFileName].s;
                                }
                            }

                            
                            //is there info?
                            FileService.Get('/data/' + system + '_thegamesdb', function(err, thegamesdb) {
                                if (err) {
                                    console.log(err);
                                    //no need to trap here
                                } else {

                                    if (thegamesdb[title]) {
                                        data.info = thegamesdb[title];
                                    }
                                }
                                
                                GamesCache.Set([cacheKey], data, (err, success) => {
                                    if (err) {
                                        return callback(err);
                                    }
                                    return callback(null, data);
                                });
                            });
                        });
                    });

                } else {
                    return callback('title: "' + title + '" not found for ' + system + ' or file: "' + file + '" not found in title folder: "' + title + '"');
                }
            });

        });
    };
})();
