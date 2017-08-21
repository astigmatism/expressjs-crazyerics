'use strict';
const config = require('config');
const pool = require('./pool.js');
const NodeCache = require('node-cache');

const nodecache = new NodeCache({
    stdTTL: 60 * 60 * 24 * 30,      //30 days
    checkperiod: 60 * 60            //1 hour 
});

module.exports = new (function() {

    var _self = this;

    this.GetCollectionNames = function (userId, callback) {

        var key = MakeCollectionsKey(userId);

        nodecache.get(key, (err, cache) => {
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

                //save to cache
                nodecache.set(key, collections, (err, success) => {
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

        //get from cache first
        var key = MakeCollectionKey(userId, name);
        
        nodecache.get(key, (err, cache) => {
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

                        //save to cache
                        nodecache.set(key, collection, (err, success) => {
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
            callback(null, result.rows[0]);
        });
    };

    this.DeleteCollectionByName = function(userId, name, callback) {
        
        var key = MakeCollectionKey(userId, name);
        
        pool.query('DELETE from collections WHERE user_id=$1 AND name=$2', [userId, name], (err, result) => {
            if (err) {
                return callback(err);
            }
            if (result.rows.length === 0) {
                return callback(); //use undef for fail case
            }

            //delete frmo cache
            nodecache.del(key, (err, success) => {
                if (err) {
                    return callback(err);
                }
                callback(null, result.rows[0]);
            });
        });
    };

    var GetCollectionGames = function(collectionId, callback) {

        pool.query('SELECT * FROM collections_titles WHERE collection_id=$1', [collectionId], (err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, result.rows); //ensure we always return an array
        });
    };

    var MakeCollectionKey = function(userId, name) {
        return 'user.' + userId + '.collection.' + name;
    }

    var MakeCollectionsKey = function(userId) {
        return 'user.' + userId + '.collections';
    }

})();