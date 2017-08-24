'use strict';
const config = require('config');
const pool = require('./pool.js');
const Cache = require('../services/cache');

module.exports = new (function() {

    var _self = this;
    var _collectionsCache = new Cache('user.$1.collections'); //value is an array of collection names for this user
    var _collectionCache = new Cache('user.$1.collection.$2'); //value is an array of titles

    this.GetCollectionNames = function (userId, callback) {

        _collectionsCache.Get([userId], (err, cache) => {
            if (err) {
                return callback(err);
            }

            if (cache) {
                return callback(null, cache);
            }

            pool.query('SELECT * from collections WHERE user_id=$1', [userId], (err, result) => {
                if (err) {
                    return callback(err);
                }

                var collections = result.rows;

                _collectionsCache.Set([userId], collections, (err, success) => {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, collections);
                });
            });
        });
    };

    this.GetCollectionByName = function(userId, name, callback, opt_createIfNoExist) {
        
        opt_createIfNoExist = (opt_createIfNoExist == true) ? true : false;
        
        //expect this format
        var collection = {
            data: {}, //from collections table
            titles: [] // from collections_games table
        };
        
        _collectionCache.Get([userId, name], (err, cache) => {
            if (err) {
                return callback(err);
            }

            if (cache) {
                return callback(null, cache);
            }
            
            //get collection data first
            GetCollectionID(userId, name, (err, data) => {
                if (err) {
                    return callback(err);
                }
                //if exists (or was created)
                if (data) {
                    collection.data = data;

                    GetCollectionGames(data.collection_id, (err, titles) => {
                        if (err) {
                            return callback(err);
                        }

                        collection.titles = titles;

                        _collectionCache.Set([userId, name], collection, (err, success) => {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, collection);
                        });
                    });
                }
                //does not exist, was not created, bail
                else {
                    return callback();
                }

            }, opt_createIfNoExist);
        });
    };

    this.PlayCollectionTitle = function(userId, collectionId, titleId, fileId, callback) {
        
        pool.query('UPDATE collections_titles SET active_file=$3, last_played=$4, play_count=play_count+1 WHERE collection_id=$1 AND title_id=$2 RETURNING *', [collectionId, titleId, fileId, new Date], (err, result) => {
            if (err) {
                return callback(err);
            }
            //if update failed to return rows, add this
            if (result.rows.length === 0) {
                
                pool.query('INSERT INTO collections_titles (collection_id, title_id, active_file) VALUES ($1, $2, $3) RETURNING *', [collectionId, titleId, fileId], (err, result) => {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, result.rows[0]); //insert result
                });
            }
            else {
                return callback(null, result.rows[0]); //update result
            }
        });
    };

    var GetCollectionID = function(userId, name, callback, opt_createIfNoExist) {

        pool.query('SELECT * from collections WHERE user_id=$1 AND name=$2', [userId, name], (err, result) => {
            if (err) {
                return callback(err);
            }

            //doesn't exist?
            if (result.rows.length === 0) {
                
                //create if no exist
                if (opt_createIfNoExist) {
                    CreateCollection(userId, name, (err, data) => {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, data);
                    });
                }
                //do not exist if does not exist
                else {
                    return callback();
                }
            }
            else {
                callback(null, result.rows[0]);
            }
        });
    };

    var CreateCollection = function(userId, name, callback) {
        
        pool.query('INSERT INTO collections (user_id, name) VALUES ($1, $2) RETURNING *', [userId, name], (err, result) => {
            if (err) {
                return callback(err);
            }
            if (result.rows.length === 0) {
                return callback();
            }

            //invalidate cache which holds collection names for this user
            _collectionsCache.Delete([userId], (err, success) => {
                if (err) {
                    return callback(err);
                }
                callback(null, result.rows[0]);
            });
        });
    };

    this.DeleteCollectionByName = function(userId, name, callback) {
        
        var key = MakeCollectionKey(userId, name);
        
        pool.query('DELETE from collections WHERE user_id=$1 AND name=$2', [userId, name], (err, result) => {
            if (err) {
                return callback(err);
            }
            if (result.rows.length === 0) {
                return callback();
            }

            //delete caches
            _collectionsCache.Delete([userId], (err, success) => {
                if (err) {
                    return callback(err);
                }
                _collectionCache.Delete([userId, name], (err, success) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, result.rows[0]);
                });
            });
        });
    };

    var GetCollectionGames = function(collectionId, callback) {

        pool.query('SELECT * FROM collections_titles WHERE collection_id=$1', [collectionId], (err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, result.rows); //ensure we always return an array, 0 length or not
        });
    };

})();