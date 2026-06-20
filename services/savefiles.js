'use strict';
const async = require('async');
const config = require('config');
const crypto = require('crypto');
const SaveFilesSQL = require('../db/savefiles');
const UtilitiesService = require('./utilities');

module.exports = new (function() {

    var _self = this;
    var _metadataFileName = '.crazyerics-savefiles.json';

    var GetConfigValue = function(name, defaultValue) {
        if (config.has(name)) {
            return config.get(name);
        }

        return defaultValue;
    };

    var GetLimits = function() {
        return {
            enabled: GetConfigValue('normalSaveFiles.enabled', true),
            serverSyncEnabled: GetConfigValue('normalSaveFiles.serverSyncEnabled', true),
            browserSyncEnabled: GetConfigValue('normalSaveFiles.browserSyncEnabled', true),
            syncIntervalMs: parseInt(GetConfigValue('normalSaveFiles.syncIntervalMs', 15000), 10),
            scanIntervalMs: parseInt(GetConfigValue('normalSaveFiles.scanIntervalMs', 5000), 10),
            writeDebounceMs: parseInt(GetConfigValue('normalSaveFiles.writeDebounceMs', 750), 10),
            runtimeFlushCommandEnabled: GetConfigValue('normalSaveFiles.runtimeFlushCommandEnabled', true),
            runtimeFlushCommandThrottleMs: parseInt(GetConfigValue('normalSaveFiles.runtimeFlushCommandThrottleMs', 5000), 10),
            runtimeFlushCommandSettleMs: parseInt(GetConfigValue('normalSaveFiles.runtimeFlushCommandSettleMs', 250), 10),
            pageLifecycleKeepaliveMaxBytes: parseInt(GetConfigValue('normalSaveFiles.pageLifecycleKeepaliveMaxBytes', 60000), 10),
            maxFileBytes: parseInt(GetConfigValue('normalSaveFiles.maxFileBytes', 8388608), 10),
            maxFilesPerGame: parseInt(GetConfigValue('normalSaveFiles.maxFilesPerGame', 64), 10),
            maxUploadBytes: parseInt(GetConfigValue('normalSaveFiles.maxUploadBytes', 33554432), 10)
        };
    };

    var BufferFromDecompressedByteArray = function(data) {
        var byteArray = UtilitiesService.Decompress.bytearray(data);
        return Buffer.from(byteArray);
    };

    var CompressBuffer = function(buffer) {
        return UtilitiesService.Compress.bytearray(new Uint8Array(buffer));
    };

    var HashBuffer = function(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    };

    var NormalizeRelativePath = function(relativePath) {
        relativePath = String(relativePath || '').replace(/\\/g, '/');

        while (relativePath.indexOf('//') >= 0) {
            relativePath = relativePath.replace(/\/\//g, '/');
        }

        return relativePath;
    };

    this.GetCoreId = function(system) {
        var systemConfig;

        if (!system || !config.has('systems.' + system)) {
            return null;
        }

        systemConfig = config.get('systems.' + system);

        if (!systemConfig || !systemConfig.emuextention || !systemConfig.emuscript) {
            return null;
        }

        return systemConfig.emuextention + ':' + systemConfig.emuscript;
    };

    this.GetStorageKey = function(userId, fileId, system, coreId) {
        return crypto.createHash('sha256')
            .update(String(userId) + ':' + String(fileId) + ':' + String(system) + ':' + String(coreId))
            .digest('hex')
            .slice(0, 32);
    };

    this.BuildContext = function(userId, eGameKey) {
        var coreId = _self.GetCoreId(eGameKey.system);
        var limits = GetLimits();

        return {
            system: eGameKey.system,
            coreId: coreId,
            storageKey: _self.GetStorageKey(userId, eGameKey.fileId, eGameKey.system, coreId || 'unknown'),
            enabled: limits.enabled,
            serverSyncEnabled: limits.serverSyncEnabled,
            browserSyncEnabled: limits.browserSyncEnabled,
            syncIntervalMs: limits.syncIntervalMs,
            scanIntervalMs: limits.scanIntervalMs,
            writeDebounceMs: limits.writeDebounceMs,
            runtimeFlushCommandEnabled: limits.runtimeFlushCommandEnabled,
            runtimeFlushCommandThrottleMs: limits.runtimeFlushCommandThrottleMs,
            runtimeFlushCommandSettleMs: limits.runtimeFlushCommandSettleMs,
            pageLifecycleKeepaliveMaxBytes: limits.pageLifecycleKeepaliveMaxBytes,
            maxFileBytes: limits.maxFileBytes,
            maxFilesPerGame: limits.maxFilesPerGame,
            maxUploadBytes: limits.maxUploadBytes,
            metadataFileName: _metadataFileName
        };
    };

    this.ValidateRelativePath = function(relativePath) {
        var parts;
        var i;

        relativePath = NormalizeRelativePath(relativePath);

        if (!relativePath) {
            throw new Error('Save file path is required.');
        }

        if (relativePath.length > 512) {
            throw new Error('Save file path is too long.');
        }

        if (relativePath.charAt(0) === '/' || relativePath.match(/^[A-Za-z]:/)) {
            throw new Error('Save file path must be relative.');
        }

        if (relativePath.indexOf('\0') >= 0) {
            throw new Error('Save file path contains a null byte.');
        }

        parts = relativePath.split('/');
        for (i = 0; i < parts.length; i++) {
            if (!parts[i] || parts[i] === '.' || parts[i] === '..') {
                throw new Error('Save file path contains an unsafe segment.');
            }
        }

        if (relativePath === _metadataFileName || relativePath.indexOf(_metadataFileName + '/') === 0) {
            throw new Error('Save file metadata is internal and cannot be uploaded.');
        }

        return relativePath;
    };

    var MapDbRow = function(row, includeData) {
        var item = {
            relativePath: row.relative_path,
            sha256: row.sha256,
            sizeBytes: row.size_bytes,
            clientUpdatedAt: row.client_updated_at,
            serverUpdatedAt: row.updated,
            version: row.version
        };

        if (includeData) {
            item.data = CompressBuffer(row.save_data || Buffer.alloc(0));
        }

        return item;
    };

    this.GetInitialSaveFiles = function(userId, eGameKey, callback) {
        var context = _self.BuildContext(userId, eGameKey);
        var result = {
            context: context,
            files: []
        };

        console.log('Normal save-file restore lookup entering service: user_id=' + userId + ', file_id=' + eGameKey.fileId + ', system=' + eGameKey.system + ', core_id=' + (context.coreId || '(none)') + ', enabled=' + context.enabled + ', serverSyncEnabled=' + context.serverSyncEnabled);

        if (!context.enabled || !context.serverSyncEnabled || !context.coreId) {
            return callback(null, result);
        }

        SaveFilesSQL.GetSaveFiles(userId, eGameKey.fileId, eGameKey.system, context.coreId, function(err, rows) {
            var files = [];
            var i;

            if (err) {
                return callback(err);
            }

            for (i = 0; i < rows.length; i++) {
                files.push(MapDbRow(rows[i], true));
            }

            console.log('Normal save-file restore lookup completed: user_id=' + userId + ', file_id=' + eGameKey.fileId + ', system=' + eGameKey.system + ', core_id=' + context.coreId + ', files=' + files.length);

            result.files = files;
            callback(null, result);
        });
    };

    this.UpsertSaveFiles = function(userId, eGameKey, payload, callback) {
        var context = _self.BuildContext(userId, eGameKey);
        var limits = GetLimits();
        var files;
        var totalUploadBytes = 0;
        var upserted = [];

        console.log('Normal save-file upload entering service: user_id=' + userId + ', file_id=' + eGameKey.fileId + ', system=' + eGameKey.system + ', core_id=' + (context.coreId || '(none)') + ', enabled=' + context.enabled + ', serverSyncEnabled=' + context.serverSyncEnabled);

        if (!context.enabled || !context.serverSyncEnabled) {
            return callback(null, { ok: true, context: context, files: [] });
        }

        if (!context.coreId) {
            return callback('No RetroArch core_id could be derived for normal save-file storage.');
        }

        payload = payload || {};
        files = payload.files;

        if (!Array.isArray(files)) {
            return callback('Request body must contain a files array.');
        }

        if (files.length > limits.maxFilesPerGame) {
            return callback('Too many save files in one request.');
        }

        async.eachSeries(files, function(file, nextFile) {
            var relativePath;
            var buffer;
            var sha256;
            var clientUpdatedAt;

            if (!file) {
                return nextFile('Save file entry is missing.');
            }

            try {
                relativePath = _self.ValidateRelativePath(file.relativePath);
            } catch (e) {
                return nextFile(e);
            }

            if (!file || !file.data) {
                return nextFile('Save file payload for ' + relativePath + ' is missing data.');
            }

            try {
                buffer = BufferFromDecompressedByteArray(file.data);
            } catch (e2) {
                return nextFile('Save file payload for ' + relativePath + ' is not a valid compressed bytearray.');
            }

            if (!buffer || !buffer.length) {
                return nextFile('Save file payload for ' + relativePath + ' is empty.');
            }

            if (buffer.length > limits.maxFileBytes) {
                return nextFile('Save file payload for ' + relativePath + ' exceeds the per-file limit.');
            }

            totalUploadBytes += buffer.length;
            if (totalUploadBytes > limits.maxUploadBytes) {
                return nextFile('Save file upload exceeds the request limit.');
            }

            sha256 = HashBuffer(buffer);
            clientUpdatedAt = parseInt(file.clientUpdatedAt || Date.now(), 10);
            if (isNaN(clientUpdatedAt)) {
                clientUpdatedAt = null;
            }

            console.log('Normal save-file database upsert attempted: user_id=' + userId + ', file_id=' + eGameKey.fileId + ', system=' + eGameKey.system + ', core_id=' + context.coreId + ', relative_path=' + relativePath + ', size_bytes=' + buffer.length + ', sha256=' + sha256);

            SaveFilesSQL.UpsertSaveFile(userId, eGameKey.fileId, eGameKey.system, context.coreId, relativePath, sha256, buffer.length, buffer, clientUpdatedAt, function(err, row, changed) {
                if (err) {
                    console.log('Normal save-file database upsert failed: user_id=' + userId + ', file_id=' + eGameKey.fileId + ', system=' + eGameKey.system + ', core_id=' + context.coreId + ', relative_path=' + relativePath + ':', err);
                    return nextFile(err);
                }

                console.log('Normal save-file database upsert completed: user_id=' + userId + ', file_id=' + eGameKey.fileId + ', system=' + eGameKey.system + ', core_id=' + context.coreId + ', relative_path=' + relativePath + ', changed=' + (!!changed) + ', save_file_id=' + (row && row.save_file_id));

                if (row) {
                    upserted.push(MapDbRow(row, false));
                }

                nextFile();
            });
        }, function(err) {
            if (err) {
                return callback(err);
            }

            console.log('Normal save-file upload service completed: user_id=' + userId + ', file_id=' + eGameKey.fileId + ', system=' + eGameKey.system + ', core_id=' + context.coreId + ', files=' + upserted.length);

            callback(null, {
                ok: true,
                context: context,
                files: upserted
            });
        });
    };

})();
