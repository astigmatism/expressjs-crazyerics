'use strict';
const async = require('async');
const config = require('config');
const FileService = require('../services/files.js');
const UtilitiesService = require('../services/utilities.js');
const TitlesSQL = require('../db/titles.js');
const FilesSQL = require('../db/files.js');
const Cache = require('../services/cache/cache.redis.js');

module.exports = new (function() {

    var _self = this;

    //this cache holds details given a gameKey (sysem, title, files, gk, info, etc)
    //... will serve all nodejs processes so use redis
    var _gameDetailsCache = new Cache('games.details.$1', { stdTTL: 0 });

    //other services can use an ehanced gameKey which includes db specific id's
    //never send this to the client, used for server-side services only
    var _enhancedGameKeyCache = new Cache('games.enhancedgamekey.$1', { stdTTL: 0 });

    //a play request is initiated, update game tables, return game details...
    this.PlayRequest = function(gameKey, callback) {

        //ensures title and file exist in backend and gets cached
        _self.EnhancedGameKey(gameKey, (err, eGameKey) => {
            if (err) {
                return callback(err);
            }

            //update files table
            UpdateFileDetails(eGameKey.fileId, (err, fileUpdateRecord) => {
                if (err) {
                    return callback(err);
                }

                //get details from file system (cached). data from romsort project
                GetGameDetails(gameKey, (err, details) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, eGameKey, details);
                });
            });
        });
    };

    //appends a regular gamekey with id's, for use on server only
    this.EnhancedGameKey = function(gameKey, callback) {
        
        //pull from cache first of course
        _enhancedGameKeyCache.Get([gameKey.gk], (err, cache) => {
            if (err) {
                return callback(err);
            }

            if (cache) {
                return callback(null, cache);
            }

            //writes record into db (if not present, otherwise returns data)
            Exists(gameKey, (err, titleRecord, fileRecord) => {
                if (err) {
                    return callback(err);
                }

                //make our enhanced gameKey
                gameKey.fileId = fileRecord.file_id;
                gameKey.titleId = titleRecord.title_id;

                _enhancedGameKeyCache.Set([gameKey.key], gameKey, (err, success) => {
                    callback(null, gameKey);
                });
            });
        });
    };

    //private

    //this function returns all details given a system and a title. must be exact matches to datafile!
    //also returns hasboxart flag and any info (ripped from thegamesdb)
    var GetGameDetails = function(gameKey, callback) {

        //I found it faster to save all the results in a cache rather than load all the caches to create the result.
        //went from 120ms response to about 30ms
        _gameDetailsCache.Get([gameKey.gk], (err, data) => {
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
                gk: null,
                info: null,
            };

            //open data file for details
            FileService.Get('/data/' + gameKey.system + '_master', function(err, masterFile) {
                if (err) {
                    return callback(err);
                }

                //if title found in datafile.. we can find data anywhere since all data is constructed from the original datafile!
                if (masterFile[gameKey.title] && masterFile[gameKey.title].f[gameKey.file]) {

                    data.system = gameKey.system;
                    data.title = gameKey.title;
                    data.file = gameKey.file;
                    data.gk = gameKey.gk;
                    data.files = masterFile[gameKey.title].f;

                            
                    //is there info?
                    FileService.Get('/data/' + gameKey.system + '_thegamesdb', function(err, thegamesdb) {
                        if (err) {
                            console.log(err);
                            //no need to trap here
                        } else {

                            if (thegamesdb[gameKey.title]) {
                                data.info = thegamesdb[gameKey.title];
                            }
                        }
                                
                        _gameDetailsCache.Set([gameKey.gk], data, (err, success) => {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, data);
                        });
                    });

                } else {
                    return callback('title: "' + gameKey.title + '" not found for ' + gameKey.system + ' or file: "' + gameKey.file + '" not found in title folder: "' + gameKey.title + '"');
                }
            });

        });
    };

    //ensures the creation of an entry in the title table. there's no need to create it until a user interacts with a game
    //once created, allows the creation of an enahced gamekey, which is cached
    var Exists = function(gameKey, callback) {
        
        TitlesSQL.GetTitle(gameKey.system, gameKey.title, (err, titleRecord) => {
            if (err) {
                return callback(err);
            }

            FilesSQL.GetFile(titleRecord.title_id, gameKey.file, (err, fileRecord) => {
                if (err) {
                    return callback(err);
                }
                callback(null, titleRecord, fileRecord);
            });
        });
    };

    var UpdateFileDetails = function(fileId, callback) {
        FilesSQL.PlayFile(fileId, (err, fileUpdateResult) => {
            if (err) {
                return callback(err);
            }
            callback(null, fileUpdateResult);
        })
    };

})();
