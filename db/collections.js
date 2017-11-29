'use strict';
const config = require('config');
const pool = require('./pool.js');
const Cache = require('../services/cache');

module.exports = new (function() {

    var _self = this;

    this.GetCollectionNames = function (userId, callback) {

        pool.query('SELECT * from collections WHERE user_id=$1', [userId], (err, result) => {
            if (err) { return callback(err); }
            return callback(null, result.rows); //always return array
        });
    };

    //either selects or inserts, returns record
    this.AddTitle = function(collectionId, titleId, callback) {
        
        pool.query('SELECT * FROM collections_titles WHERE collection_id=$1 AND title_id=$2', [collectionId, titleId], (err, selectResult) => {
            if (err) { return callback(err); }

            if (selectResult.rows.length > 0) {
                return callback(null, selectResult.rows[0]);
            }
        
            pool.query('INSERT INTO collections_titles (collection_id, title_id) VALUES ($1, $2) RETURNING *', [collectionId, titleId], (err, result) => {
                if (err) { return callback(err); }
                return callback(null, result.rows[0]); //insert result
            });
        });
    };

    this.DeleteTitle = function(collectionId, titleId, callback) {

        pool.query('DELETE FROM collections_titles WHERE collection_id=$1 AND title_id=$2 RETURNING *', [collectionId, titleId], (err, result) => {
            if (err) { return callback(err); }
            callback(null, result);
        });
    };

    this.GetCollectionByName = function(userId, name, callback, opt_create) {

        pool.query('SELECT * from collections WHERE user_id=$1 AND name=$2', [userId, name], (err, result) => {
            if (err) { return callback(err); }

            if (result.rows.length > 0) {
                return callback(null, result.rows[0]);
            }

            if (opt_create) {
                _self.CreateCollection(userId, name, (err, collectionRecord) => {
                    if (err) { return callback(err); }
                    return callback(null, collectionRecord);
                });
            }
        });
    };

    this.GetCollectionById = function(userId, collectionId, callback) {
        pool.query('SELECT * from collections WHERE user_id=$1 AND collection_id=$2', [userId, collectionId], (err, result) => {
            if (err) { return callback(err); }

            if (result.rows.length > 0) {
                return callback(null, result.rows[0]);
            }
            callback('GetCollectionById returned nothing with userId ' + userId + ' collectionId ' + collectionId);
        });
    };

    this.CreateCollection = function(userId, name, callback) {
        
        pool.query('INSERT INTO collections (user_id, name) VALUES ($1, $2) RETURNING *', [userId, name], (err, result) => {
            if (err) { return callback(err); }
            callback(null, result.rows[0]);
        });
    };

    //ensure the user owns this collection ahead of time
    this.DeleteCollection = function(userId, collectionId, callback) {
        
        pool.query('DELETE from collections WHERE user_id=$1 AND collection_id=$2', [userId, collectionId], (err, result) => {
            if (err) { return callback(err); }
            callback(null, result.rows);
        });
    };

    this.GetCollectionTitles = function(collectionId, callback) {

        //joins with users_titles
        var countSubQuery = '(SELECT COUNT(save_id) FROM saves WHERE saves.file_id=users_titles.active_file AND saves.user_id=users_titles.user_id)';
        pool.query('SELECT users_titles.*, ' + countSubQuery + ' AS save_count FROM collections_titles INNER JOIN users_titles ON collections_titles.title_id=users_titles.title_id WHERE collections_titles.collection_id=$1', [collectionId], (err, result) => {
            if (err) { return callback(err); }
            callback(null, result.rows); //ensure we always return an array, 0 length or not
        });
    };

    // this.ReassignCollectionWithSort = function(collectionId, userId, sort, asc, callback) {

    //     pool.query('UPDATE collections SET user_id=$1, sort=$3, "asc"=$4 WHERE collection_id=$2', [userId, collectionId, sort, asc], (err, result) => {
    //         if (err) {
    //             return callback(err);
    //         }
    //         callback(null, result.rows[0]);
    //     });
    // };

    //returns Number or undef
    this.GetActiveCollectionId = function(userId, callback) {

        pool.query('SELECT collection_id FROM collections_active WHERE user_id=$1', [userId], (err, result) => {
            if (err) { return callback(err); }

            if (result.rows.length > 0) {
                return callback(null, result.rows[0].collection_id); 
            }
            return callback();
        });
    };

    //we ensured the user owns this collection id before hand
    this.SetActiveCollection = function(userId, collectionId, callback) {

        pool.query('UPDATE collections_active SET collection_id=$1 WHERE user_id=$2 RETURNING *', [collectionId, userId], (err, updateResult) => {
            if (err) { return callback(err); }

            if (updateResult.rows.length > 0) {
                return callback(null, 'update');
            }

            pool.query('INSERT INTO collections_active (user_id, collection_id) VALUES ($1, $2) RETURNING *', [userId, collectionId], (err, insertResult) => {
                if (err) { return callback(err); }

                callback(null, 'insert');
            });
        });
    };
})();