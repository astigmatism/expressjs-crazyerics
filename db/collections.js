'use strict';
const config = require('config');
const pool = require('./pool.js');
const Cache = require('../services/cache');

module.exports = new (function() {

    var _self = this;
    var _collectionsCache = new Cache('user.$1.collections'); //value is an array of collection names for this user

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

    this.AddTitle = function(collectionId, titleId, callback) {
        
        pool.query('SELECT * FROM collections_titles WHERE collection_id=$1 AND title_id=$2', [collectionId, titleId], (err, selectResult) => {
            if (err) {
                return callback(err);
            }
            if (selectResult.rows.length > 0) {
                return callback(null, selectResult.rows[0]);
            }
        
            pool.query('INSERT INTO collections_titles (collection_id, title_id) VALUES ($1, $2) RETURNING *', [collectionId, titleId], (err, result) => {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.rows[0]); //insert result
            });
        });
    };

    this.DeleteTitle = function(collectionId, titleId, callback) {

        pool.query('DELETE FROM collections_titles WHERE collection_id=$1 AND title_id=$2 RETURNING *', [collectionId, titleId], (err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, result);
        });
    };

    this.GetCollectionByName = function(userId, name, callback, opt_createIfNoExist) {

        pool.query('SELECT * from collections WHERE user_id=$1 AND name=$2', [userId, name], (err, result) => {
            if (err) {
                return callback(err);
            }

            //doesn't exist?
            if (result.rows.length === 0) {
                
                //create if no exist
                if (opt_createIfNoExist) {
                    _self.CreateCollection(userId, name, (err, data) => {
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

    this.CreateCollection = function(userId, name, callback) {
        
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
        
        pool.query('DELETE from collections WHERE user_id=$1 AND name=$2', [userId, name], (err, result) => {
            if (err) {
                return callback(err);
            }

            _collectionsCache.Delete([userId], (err, success) => {
                if (err) {
                    return callback(err);
                }
                callback(null, result.rows[0]);
            });
        });
    };

    this.GetCollectionTitles = function(collectionId, callback) {

        //joins with users_titles
        var countSubQuery = '(SELECT COUNT(save_id) FROM saves WHERE saves.file_id=users_titles.active_file AND saves.user_id=users_titles.user_id)';
        pool.query('SELECT users_titles.*, ' + countSubQuery + ' AS save_count FROM collections_titles INNER JOIN users_titles ON collections_titles.title_id=users_titles.title_id WHERE collections_titles.collection_id=$1', [collectionId], (err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, result.rows); //ensure we always return an array, 0 length or not
        });
    };

})();