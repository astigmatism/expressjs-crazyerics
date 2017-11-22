'use strict';
const async = require('async');
const config = require('config');
const SavesSQL = require('../db/saves');
const Cache = require('./cache');
const CollectionsService = require('./collections');

module.exports = new (function() {

    var _self = this;
    var _savesCache = new Cache('saves.user.$1.file.$2');
    var maxSavesPerGame = parseInt(config.get('maxSavesPerGame'), 10);

    this.NewSave = function(userId, eGameKey, timestamp, screenData, stateData, type, callback) {
                
        SavesSQL.NewSave(userId, eGameKey.fileId, timestamp, screenData, stateData, type, (err, saveRecord) => {
            if (err) {
                return callback(err);
            }

            CheckForPruning(userId, eGameKey, (err, prunedRecord) => {
                if (err) {
                    return callback(err);
                }

                //since a new save increases the save count, something we attach to collection data for the client (in the popup)
                //reset the collection cache (which also informs sync to update the client)
                CollectionsService.ResetActiveCollectionCache(userId, (err) => {
                    if (err) {
                        return callback(err);
                    }

                    //of course the same for the here too ;)
                    _self.ResetSavesCache(userId, eGameKey.fileId, (err) => {
                        if (err) {
                            return callback(err);
                        }

                        //no need to return anything, sync does that for us
                        callback();
                    });
                });
            });
        });
    };

    this.GetSaves = function(userId, eGameKey, callback) {
        
        //get from cache first
        _savesCache.Get([userId, eGameKey.fileId], (err, cache) => {
            if (err) {
                return callback(err);
            }

            if (cache) {
                return callback(null, cache);
            }
        
            SavesSQL.GetSaves(userId, eGameKey.fileId, (err, savesResult) => {
                if (err) {
                    return callback(err);
                }

                _savesCache.Set([userId, eGameKey.fileId], savesResult, (err, success) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, savesResult);
                });
            });
        });
    };

    //get a specific save record using userId, eGameKey and a timestamp
    this.GetSave = function(userId, eGameKey, timestamp, callback) {
        
        //pull from cache all saves for this current game
        _self.GetSaves(userId, eGameKey, (err, saves) => {
            if (err) {
                return callback(err);
            }
            
            var saveId = -1;
            
            //parse through our cache looking for the correct timestamp
            for (var i = 0, len = saves.length; i < len; ++i) {
                if (saves[i].client_timestamp === timestamp) {
                    saveId = saves[i].save_id;
                    break;
                }
            }

            if (saveId === -1) {
                return callback('The timestamp for this save was not found in the current games save data');
            }

            SavesSQL.GetSave(saveId, (err, saveStateBinary) => {
                if (err) {
                    return callback(err);
                }
                callback(null, saveStateBinary);
            });
        });
    };

    //a utility function that clears out the current save cache and tells sync to update client
    this.ResetSavesCache = function(userId, fileId, callback) {
        
        //invalidate cache
        _savesCache.Delete([userId, fileId], (err) => {
            if (err) {
                return callback(err);
            }

            //inform sync that new saves information is ready for client consumption
            //this means that outgoing operations will commence, which rebuilds the cache with new data
            _self.Sync.ready = true;
        
            return callback();
        });
    };

    var CheckForPruning = function(userId, eGameKey, callback) {

        _self.GetSaves(userId, eGameKey, (err, saves) => {
            if (err) {
                return callback(err);
            }

            //since this cache has not been reset yet with the new entry...
            if (saves.length !== maxSavesPerGame) {
                return callback();
            }

            var prunedSave = saves.pop(); //pop oldest off end of array

            SavesSQL.DeleteSave(prunedSave.save_id, (err, deletedRecord) => {
                if (err) {
                    return callback(err);
                }
                callback(null, deletedRecord);
            });
        });
    }

    this.Sync = new (function() {
        
        var __self = this;
        this.ready = false;

        //client had new data to update the server
        //not likely used here... the client is not authoritative over the server
        this.Incoming = function() {
        };

        //update the client with new data
        this.Outgoing = function(userId, eGameKey, callback) {

            //get current saves, will rebuild cache if necessary
            _self.GetSaves(userId, eGameKey, (err, savesResult) => {
                if (err) {
                    return callback(err);
                }

                var result = [];
                for (var i = 0, len = savesResult.length; i < len; ++i) {
                    result.push({
                        //saveId: savesResult[i].save_id, //dont want to expose this.... TODO!!!!
                        type: savesResult[i].type,
                        timestamp: savesResult[i].client_timestamp,
                        screenshot: savesResult[i].screenshot
                    });
                }

                callback(null, result);
            });
        };

        return this;
    })();
    
})();
