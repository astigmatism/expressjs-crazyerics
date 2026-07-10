'use strict';
const pool = require('./pool.js');

module.exports = new (function() {

    var _self = this;
    var _collectionTitlePositionAvailable = null;
    var _collectionTitlePositionChecking = false;
    var _collectionTitlePositionCreateAttempted = false;
    var _collectionTitlePositionCallbacks = [];
    var _collectionTitlePositionWarningLogged = false;

    var LogCollectionTitlePositionWarning = function(message, err) {

        if (_collectionTitlePositionWarningLogged) {
            return;
        }

        _collectionTitlePositionWarningLogged = true;
        console.log('Collection manual order storage warning: ' + message, err && err.stack ? err.stack : (err && err.message ? err.message : err || ''));
    };

    var FlushCollectionTitlePositionCallbacks = function(err, available) {

        var callbacks = _collectionTitlePositionCallbacks.slice(0);
        _collectionTitlePositionCallbacks = [];
        _collectionTitlePositionChecking = false;

        for (var i = 0, len = callbacks.length; i < len; ++i) {
            callbacks[i].callback(err, available === true);
        }
    };

    var QuoteIdentifier = function(name) {
        return '"' + String(name).replace(/"/g, '""') + '"';
    };

    var BuildCollectionTitleBackfillOrder = function(columns) {

        var existing = {};
        var order = ['position NULLS LAST'];
        var preferred = [
            'created',
            'created_at',
            'date_added',
            'added_at',
            'collection_title_id',
            'collections_title_id',
            'id'
        ];
        var i;

        columns = columns || [];

        for (i = 0; i < columns.length; ++i) {
            existing[columns[i].column_name] = true;
        }

        for (i = 0; i < preferred.length; ++i) {
            if (existing[preferred[i]]) {
                order.push(QuoteIdentifier(preferred[i]) + ' NULLS LAST');
            }
        }

        order.push('ctid');
        return order.join(', ');
    };

    var EnsureCollectionTitlePositionIndex = function(callback) {

        var indexName = 'collections_titles_collection_position_idx';

        pool.query("SELECT 1 FROM pg_class WHERE relkind='i' AND relname=$1 LIMIT 1", [indexName], (err, result) => {
            if (err) {
                return callback(err);
            }

            if (result.rows.length > 0) {
                return callback();
            }

            pool.query('CREATE INDEX ' + indexName + ' ON collections_titles (collection_id, position)', [], (err) => {
                if (err && err.code !== '42P07') {
                    return callback(err);
                }

                callback();
            });
        });
    };

    var BackfillCollectionTitlePositions = function(callback) {

        pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='collections_titles' AND column_name = ANY($1)", [[
            'created',
            'created_at',
            'date_added',
            'added_at',
            'collection_title_id',
            'collections_title_id',
            'id'
        ]], (err, columnsResult) => {
            if (err) { return callback(err); }

            var orderBy = BuildCollectionTitleBackfillOrder(columnsResult.rows);
            var query = 'WITH ranked AS (' +
                ' SELECT ctid, ROW_NUMBER() OVER (PARTITION BY collection_id ORDER BY ' + orderBy + ') - 1 AS rn' +
                ' FROM collections_titles' +
                ')' +
                ' UPDATE collections_titles ct SET position=ranked.rn' +
                ' FROM ranked WHERE ct.ctid=ranked.ctid AND ct.position IS NULL';

            pool.query(query, [], (err) => {
                if (err) { return callback(err); }

                EnsureCollectionTitlePositionIndex(callback);
            });
        });
    };

    var CheckCollectionTitlePositionColumn = function(callback) {

        pool.query("SELECT 1 FROM information_schema.columns WHERE table_name='collections_titles' AND column_name='position' LIMIT 1", [], (err, result) => {
            if (err) { return callback(err); }
            callback(null, result.rows.length > 0);
        });
    };

    var CreateCollectionTitlePositionColumn = function(callback) {

        _collectionTitlePositionCreateAttempted = true;

        pool.query('ALTER TABLE collections_titles ADD COLUMN position INTEGER', [], (err) => {
            if (err && err.code !== '42701') {
                return callback(err);
            }

            BackfillCollectionTitlePositions((err) => {
                if (err) {
                    LogCollectionTitlePositionWarning('position exists but automatic backfill/index creation failed. Run migrations/20260710_add_collection_title_position.sql manually.', err);
                }

                callback();
            });
        });
    };

    var GetCollectionTitlePositionSupport = function(callback, opt_tryCreate) {

        var tryCreate = opt_tryCreate === true;

        if (_collectionTitlePositionAvailable === true) {
            return callback(null, true);
        }

        if (_collectionTitlePositionAvailable === false && (!tryCreate || _collectionTitlePositionCreateAttempted)) {
            return callback(null, false);
        }

        _collectionTitlePositionCallbacks.push({
            callback: callback,
            tryCreate: tryCreate
        });

        if (_collectionTitlePositionChecking) {
            return;
        }

        _collectionTitlePositionChecking = true;

        CheckCollectionTitlePositionColumn((err, exists) => {

            var shouldTryCreate = false;
            var i;

            if (err) {
                LogCollectionTitlePositionWarning('could not check whether collections_titles.position exists. Manual order persistence is disabled until the database is available.', err);
                _collectionTitlePositionAvailable = false;
                return FlushCollectionTitlePositionCallbacks(null, false);
            }

            if (exists) {
                _collectionTitlePositionAvailable = true;
                BackfillCollectionTitlePositions((err) => {
                    if (err) {
                        LogCollectionTitlePositionWarning('position exists but automatic backfill/index creation failed. Existing manual order reads will continue.', err);
                    }

                    FlushCollectionTitlePositionCallbacks(null, true);
                });
                return;
            }

            for (i = 0; i < _collectionTitlePositionCallbacks.length; ++i) {
                if (_collectionTitlePositionCallbacks[i].tryCreate) {
                    shouldTryCreate = true;
                    break;
                }
            }

            if (!shouldTryCreate || _collectionTitlePositionCreateAttempted) {
                // Read paths can fall back to the original unordered query without
                // permanently caching a missing column. This lets a manually run
                // migration take effect without requiring a process restart.
                return FlushCollectionTitlePositionCallbacks(null, false);
            }

            CreateCollectionTitlePositionColumn((err) => {
                if (err) {
                    LogCollectionTitlePositionWarning('could not create collections_titles.position automatically. Run migrations/20260710_add_collection_title_position.sql manually.', err);
                    _collectionTitlePositionAvailable = false;
                    return FlushCollectionTitlePositionCallbacks(null, false);
                }

                _collectionTitlePositionAvailable = true;
                FlushCollectionTitlePositionCallbacks(null, true);
            });
        });
    };

    var NormalizeTitleId = function(titleId) {

        titleId = parseInt(titleId, 10);

        if (isNaN(titleId)) {
            return null;
        }

        return titleId;
    };

    this.GetCollectionNames = function (userId, callback) {

        pool.query('SELECT * from collections WHERE user_id=$1', [userId], (err, result) => {
            if (err) { return callback(err); }
            return callback(null, result.rows); //always return array
        });
    };

    //either selects or inserts, returns record
    this.AddTitle = function(collectionId, titleId, callback) {

        GetCollectionTitlePositionSupport((err, hasPosition) => {
            if (err) { return callback(err); }

            pool.query('SELECT * FROM collections_titles WHERE collection_id=$1 AND title_id=$2', [collectionId, titleId], (err, selectResult) => {
                if (err) { return callback(err); }

                if (selectResult.rows.length > 0) {
                    return callback(null, selectResult.rows[0]);
                }

                if (!hasPosition) {
                    return pool.query('INSERT INTO collections_titles (collection_id, title_id) VALUES ($1, $2) RETURNING *', [collectionId, titleId], (err, result) => {
                        if (err) { return callback(err); }
                        return callback(null, result.rows[0]); //insert result
                    });
                }

                var insertQuery = 'INSERT INTO collections_titles (collection_id, title_id, position)' +
                    ' SELECT $1, $2, COALESCE(MAX(position), -1) + 1 FROM collections_titles WHERE collection_id=$1 RETURNING *';

                pool.query(insertQuery, [collectionId, titleId], (err, result) => {
                    if (err) { return callback(err); }
                    return callback(null, result.rows[0]); //insert result
                });
            });
        }, true);
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

    this.RenameCollection = function(userId, existingCollectionId, name, callback) {

        pool.query('UPDATE collections SET name=$1 WHERE collection_id=$2 AND user_id=$3 RETURNING *', [name, existingCollectionId, userId], (err, result) => {
            if (err) { return callback(err); }
            callback(null, result.rows[0]);
        });
    };

    //ensure the user owns this collection ahead of time
    this.DeleteCollection = function(userId, collectionId, callback) {

        pool.query('DELETE from collections WHERE user_id=$1 AND collection_id=$2 RETURNING *', [userId, collectionId], (err, deleteResult) => {
            if (err) { return callback(err); }

            //get remaining collections to inform service of which collection to switch to
            _self.GetCollectionNames(userId, (err, namesResult) => {
                if (err) { return callback(err); }

                callback(null, deleteResult.rows, namesResult);
            });
        });
    };

    this.GetCollectionTitles = function(userId, collectionId, callback) {

        GetCollectionTitlePositionSupport((err, hasPosition) => {
            if (err) { return callback(err); }

            /*
             * Collection membership is title-based, but older Add to Collection
             * flows could create more than one users_titles row for the same
             * user/title. A plain join expands one shelf item into duplicate
             * server rows, which then makes PATCH /collections/order fail its
             * exact-count validation even though the browser is sending the
             * visible shelf correctly. Canonicalize both sides of the join.
             */
            var countSubQuery = '(SELECT COUNT(save_id) FROM saves WHERE saves.file_id=ut.active_file AND saves.user_id=ut.user_id)';
            var membershipProjection = hasPosition ?
                'ct.position AS collection_position' :
                'NULL::integer AS collection_position';
            var membershipOrder = hasPosition ?
                'ct.title_id, ct.position ASC NULLS LAST, ct.ctid ASC' :
                'ct.title_id, ct.ctid ASC';
            var finalOrder = hasPosition ?
                'cct.collection_position ASC NULLS LAST, cct.collection_row_ctid ASC' :
                'cct.collection_row_ctid ASC';

            var query = 'WITH canonical_collection_titles AS (' +
                ' SELECT DISTINCT ON (ct.title_id) ct.collection_id, ct.title_id, ' + membershipProjection + ', ct.ctid AS collection_row_ctid' +
                ' FROM collections_titles ct' +
                ' WHERE ct.collection_id=$1' +
                ' ORDER BY ' + membershipOrder +
                '),' +
                ' canonical_user_titles AS (' +
                ' SELECT DISTINCT ON (ut.title_id) ut.*' +
                ' FROM users_titles ut' +
                ' WHERE ut.user_id=$2' +
                ' ORDER BY ut.title_id, ut.last_played DESC NULLS LAST, ut.play_count DESC NULLS LAST, ut.active_file DESC NULLS LAST, ut.ctid DESC' +
                ')' +
                ' SELECT ut.*, cct.collection_position, ' + countSubQuery + ' AS save_count' +
                ' FROM canonical_collection_titles cct' +
                ' INNER JOIN canonical_user_titles ut ON cct.title_id=ut.title_id' +
                ' ORDER BY ' + finalOrder;

            pool.query(query, [collectionId, userId], (err, result) => {
                if (err) { return callback(err); }
                callback(null, result.rows); //ensure we always return an array, 0 length or not
            });
        }, false);
    };

    this.UpdateTitleOrder = function(collectionId, orderedTitleIds, callback) {

        orderedTitleIds = orderedTitleIds || [];

        GetCollectionTitlePositionSupport((err, hasPosition) => {
            if (err) { return callback(err); }

            if (!hasPosition) {
                var unavailable = new Error('Collection manual order storage is not available. Run migrations/20260710_add_collection_title_position.sql before saving order changes.');
                unavailable.safeStatus = 503;
                unavailable.safeMessage = 'Collection order storage is not available. Please run the collection order migration and try again.';
                return callback(unavailable);
            }

            if (orderedTitleIds.length < 1) {
                return callback(null, []);
            }

            var values = [];
            var placeholders = [];
            var titleId;
            var i;

            for (i = 0; i < orderedTitleIds.length; ++i) {
                titleId = NormalizeTitleId(orderedTitleIds[i]);

                if (titleId === null) {
                    return callback(new Error('Invalid title id in collection order update'));
                }

                values.push(titleId);
                values.push(i);
                placeholders.push('($' + (values.length - 1) + '::integer, $' + values.length + '::integer)');
            }

            values.push(collectionId);

            var query = 'UPDATE collections_titles SET position=ordered.position' +
                ' FROM (VALUES ' + placeholders.join(',') + ') AS ordered(title_id, position)' +
                ' WHERE collections_titles.collection_id=$' + values.length + ' AND collections_titles.title_id=ordered.title_id' +
                ' RETURNING collections_titles.title_id, collections_titles.position';

            pool.query(query, values, (err, result) => {
                if (err) { return callback(err); }
                callback(null, result.rows || []);
            });
        }, true);
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

    this.ClearActiveCollection = function(userId, callback) {

        pool.query('DELETE FROM collections_active WHERE user_id=$1 RETURNING *', [userId], (err, result) => {
            if (err) { return callback(err); }
            callback(null, result.rows);
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
