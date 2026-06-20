'use strict';
const pool = require('./pool.js');

module.exports = new (function() {

    this.GetSaveFiles = function(userId, fileId, system, coreId, callback) {

        pool.query(
            'SELECT save_file_id, user_id, file_id, system, core_id, relative_path, sha256, size_bytes, save_data, client_updated_at, created, updated, version FROM save_files WHERE user_id=$1 AND file_id=$2 AND system=$3 AND core_id=$4 ORDER BY relative_path',
            [userId, fileId, system, coreId],
            function(err, result) {
                if (err) {
                    return callback(err);
                }

                callback(null, result.rows);
            }
        );
    };

    this.GetSaveFile = function(userId, fileId, system, coreId, relativePath, callback) {

        pool.query(
            'SELECT save_file_id, user_id, file_id, system, core_id, relative_path, sha256, size_bytes, save_data, client_updated_at, created, updated, version FROM save_files WHERE user_id=$1 AND file_id=$2 AND system=$3 AND core_id=$4 AND relative_path=$5',
            [userId, fileId, system, coreId, relativePath],
            function(err, result) {
                if (err) {
                    return callback(err);
                }

                callback(null, result.rows.length ? result.rows[0] : null);
            }
        );
    };

    this.UpsertSaveFile = function(userId, fileId, system, coreId, relativePath, sha256, sizeBytes, buffer, clientUpdatedAt, callback) {

        var values = [
            userId,
            fileId,
            system,
            coreId,
            relativePath,
            sha256,
            sizeBytes,
            buffer,
            clientUpdatedAt || null
        ];

        var sql = '' +
            'INSERT INTO save_files (user_id, file_id, system, core_id, relative_path, sha256, size_bytes, save_data, client_updated_at) ' +
            'VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ' +
            'ON CONFLICT (user_id, file_id, system, core_id, relative_path) DO UPDATE SET ' +
            'sha256 = EXCLUDED.sha256, ' +
            'size_bytes = EXCLUDED.size_bytes, ' +
            'save_data = EXCLUDED.save_data, ' +
            'client_updated_at = EXCLUDED.client_updated_at, ' +
            'updated = NOW(), ' +
            'version = save_files.version + 1 ' +
            'WHERE save_files.sha256 <> EXCLUDED.sha256 ' +
            'RETURNING save_file_id, user_id, file_id, system, core_id, relative_path, sha256, size_bytes, client_updated_at, created, updated, version';

        pool.query(sql, values, function(err, result) {
            if (err) {
                return callback(err);
            }

            if (result.rows.length) {
                return callback(null, result.rows[0], true);
            }

            // If the content hash was unchanged, the ON CONFLICT WHERE clause avoids
            // a redundant BYTEA rewrite. Return the existing metadata instead.
            module.exports.GetSaveFile(userId, fileId, system, coreId, relativePath, function(selectErr, existing) {
                if (selectErr) {
                    return callback(selectErr);
                }

                callback(null, existing, false);
            });
        });
    };

    this.DeleteSaveFile = function(userId, fileId, system, coreId, relativePath, callback) {

        pool.query(
            'DELETE FROM save_files WHERE user_id=$1 AND file_id=$2 AND system=$3 AND core_id=$4 AND relative_path=$5 RETURNING save_file_id, user_id, file_id, system, core_id, relative_path, sha256, size_bytes, client_updated_at, created, updated, version',
            [userId, fileId, system, coreId, relativePath],
            function(err, result) {
                if (err) {
                    return callback(err);
                }

                callback(null, result.rows.length ? result.rows[0] : null);
            }
        );
    };

})();
