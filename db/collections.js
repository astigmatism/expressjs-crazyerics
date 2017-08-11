'use strict';
const pool = require('./pool.js');

module.exports = new (function() {

    this.CreateCollection = function(userId, name) {
        pool.query('INSERT INTO collections (user_id, name) VALUES ($1, $2) RETURNING *', [userId, name], (err, result) => {
            if (err) {
                return callback(err);
            }
            callback(null, result.rows[0]);
        });
    };

    this.GetCollection = function(userId, collectionId, callback) {
        pool.query('SELECT * from collections WHERE user_id=$1 AND collection_id=$2', [userId, collectionId], (err, result) => {
            if (err) {
                return callback(err);
            }
            if (result.rows.length === 0) {
                return callback('No records');
            }
            callback(null, result.rows[0]);
        });
    };

    this.GetCollectionByName = function(userId, name, callback) {
        pool.query('SELECT * from collections WHERE user_id=$1 AND name=$2', [userId, name], (err, result) => {
            if (err) {
                return callback(err);
            }
            if (result.rows.length === 0) {
                return callback('No records');
            }
            callback(null, result.rows[0]);
        });
    }
})();