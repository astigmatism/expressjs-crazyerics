'use strict';
const pool = require('./pool.js');

module.exports = new (function() {

    var _self = this;

    this.GetActive = function(callback) {

        pool.query('SELECT * FROM featured_collections WHERE active=TRUE ORDER BY featured_collection_id ASC', [], (err, result) => {
            if (err) { return callback(err); }
            callback(null, result.rows || []);
        });
    };

    this.GetById = function(featuredCollectionId, callback) {

        pool.query('SELECT * FROM featured_collections WHERE featured_collection_id=$1', [featuredCollectionId], (err, result) => {
            if (err) { return callback(err); }

            if (result.rows.length < 1) {
                return callback();
            }

            callback(null, result.rows[0]);
        });
    };

    this.GetByName = function(name, callback) {

        pool.query('SELECT * FROM featured_collections WHERE LOWER(name)=LOWER($1) LIMIT 1', [name], (err, result) => {
            if (err) { return callback(err); }

            if (result.rows.length < 1) {
                return callback();
            }

            callback(null, result.rows[0]);
        });
    };

    this.UpsertByName = function(name, gameKeys, sourceCollectionId, publishedByUserId, sortState, callback) {

        if (typeof sortState === 'function') {
            callback = sortState;
            sortState = null;
        }

        if (typeof callback !== 'function') {
            throw new TypeError('FeaturedSQL.UpsertByName requires a callback function.');
        }

        _self.GetByName(name, (err, existingRecord) => {
            if (err) { return callback(err); }

            if (existingRecord) {
                return Update(existingRecord.featured_collection_id, name, gameKeys, sourceCollectionId, publishedByUserId, sortState, callback);
            }

            Insert(name, gameKeys, sourceCollectionId, publishedByUserId, sortState, (insertErr, insertedRecord) => {
                if (insertErr && insertErr.code === '23505') {
                    return _self.GetByName(name, (selectErr, collisionRecord) => {
                        if (selectErr) { return callback(selectErr); }
                        if (!collisionRecord) { return callback(insertErr); }
                        Update(collisionRecord.featured_collection_id, name, gameKeys, sourceCollectionId, publishedByUserId, sortState, callback);
                    });
                }

                if (insertErr) { return callback(insertErr); }
                callback(null, insertedRecord, 'insert');
            });
        });
    };

    this.Delete = function(featuredCollectionId, callback) {

        pool.query('DELETE FROM featured_collections WHERE featured_collection_id=$1 RETURNING *', [featuredCollectionId], (err, result) => {
            if (err) { return callback(err); }

            if (result.rows.length < 1) {
                return callback(null, null);
            }

            callback(null, result.rows[0]);
        });
    };

    this.GetMostPlayed = function(system, limit, callback) {

        //select * from files inner join titles on files.title_id=titles.title_id where titles.system_id='nes' order by play_count desc limit 18
        pool.query('SELECT files.name as file, titles.name as title, systems.name as system_name FROM files INNER JOIN titles on files.title_id=titles.title_id INNER JOIN systems ON titles.system_id=systems.system_id WHERE titles.system_id=$1 ORDER BY files.play_count DESC LIMIT $2', [system, limit], (err, result) => {
            if (err) return callback(err);
            return callback(null, result.rows); //always return array
        });
    };

    var Insert = function(name, gameKeys, sourceCollectionId, publishedByUserId, sortState, callback) {

        pool.query('INSERT INTO featured_collections (name, game_keys, source_collection_id, published_by_user_id) VALUES ($1, $2::jsonb, $3, $4) RETURNING *', [name, BuildGameKeysJson(gameKeys, sortState), sourceCollectionId || null, publishedByUserId || null], (err, result) => {
            if (err) { return callback(err); }
            callback(null, result.rows[0]);
        });
    };

    var Update = function(featuredCollectionId, name, gameKeys, sourceCollectionId, publishedByUserId, sortState, callback) {

        pool.query('UPDATE featured_collections SET name=$1, game_keys=$2::jsonb, source_collection_id=$3, published_by_user_id=$4, active=TRUE, updated=NOW() WHERE featured_collection_id=$5 RETURNING *', [name, BuildGameKeysJson(gameKeys, sortState), sourceCollectionId || null, publishedByUserId || null, featuredCollectionId], (err, result) => {
            if (err) { return callback(err); }
            callback(null, result.rows[0], 'update');
        });
    };

    var BuildGameKeysJson = function(gameKeys, sortState) {

        gameKeys = NormalizeGameKeyListForDb(gameKeys);
        sortState = NormalizeSortStateForDb(sortState);

        if (sortState.sort) {
            return JSON.stringify({
                version: 2,
                keys: gameKeys,
                sortState: sortState
            });
        }

        return JSON.stringify(gameKeys);
    };

    var NormalizeGameKeyListForDb = function(gameKeys) {

        if (!Array.isArray(gameKeys)) {
            return [];
        }

        var result = [];
        for (var i = 0, len = gameKeys.length; i < len; ++i) {
            if (typeof gameKeys[i] === 'string' && gameKeys[i].trim() !== '') {
                result.push(gameKeys[i]);
            }
        }

        return result;
    };

    var NormalizeSortStateForDb = function(sortState) {

        sortState = sortState || {};

        return {
            sort: typeof sortState.sort === 'string' && sortState.sort.trim() !== '' ? sortState.sort.trim() : null,
            asc: typeof sortState.asc === 'boolean' ? sortState.asc : null
        };
    };
})();
