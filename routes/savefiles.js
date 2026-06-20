'use strict';
const express = require('express');
const router = express.Router();
const UtilitiesService = require('../services/utilities');
const GamesService = require('../services/games');
const SaveFilesService = require('../services/savefiles');
const SyncService = require('../services/sync');

var CreateApiError = function(message, status, safeCode, cause) {
    var err = message instanceof Error ? message : new Error(message || 'Normal save-file API request failed.');

    err.status = status || err.status || 500;
    err.expose = err.status < 500;

    if (safeCode) {
        err.safeCode = safeCode;
    }

    if (cause) {
        err.cause = cause;
    }

    return err;
};

var ParseGameKey = function(req) {
    var gk = req.query && req.query.gk ? decodeURIComponent(req.query.gk) : null;
    var gameKey;

    if (!gk) {
        throw CreateApiError('Missing game key.', 400, 'missing_game_key');
    }

    gameKey = UtilitiesService.Decompress.gamekey(gk);
    if (!gameKey) {
        throw CreateApiError('Invalid game key.', 400, 'invalid_game_key');
    }

    return gameKey;
};

var RequireUserAndGameKey = function(req, callback) {
    var gameKey;

    if (!req.user || !req.user.user_id) {
        return callback(CreateApiError('Authentication is required for normal save files.', 401, 'authentication_required'));
    }

    try {
        gameKey = ParseGameKey(req);
    } catch (e) {
        return callback(e.status ? e : CreateApiError('Invalid game key.', 400, 'invalid_game_key', e));
    }

    GamesService.EnhancedGameKey(gameKey, function(err, eGameKey) {
        if (err) {
            return callback(err);
        }

        if (!eGameKey || !eGameKey.fileId || !eGameKey.system) {
            return callback(CreateApiError('Invalid game key.', 400, 'invalid_game_key'));
        }

        callback(null, req.user.user_id, eGameKey);
    });
};

var SendCompressedApiResponse = function(res, next, payload, userId, eGameKey) {
    SyncService.Outgoing(payload, userId, eGameKey, function(syncErr, compressedResult) {
        if (syncErr) {
            return next(NormalizeRouteError(syncErr));
        }

        res.json(compressedResult);
    });
};


var IsClientSaveFileError = function(err) {
    var message = typeof err === 'string' ? err : (err && err.message ? err.message : '');

    return !!message && !!message.match(/^(Request body|Save file|Too many save files|No RetroArch core_id|Normal save files are disabled|Invalid game key|Missing game key|Authentication is required)|exceeds the/i);
};

var NormalizeRouteError = function(err) {
    if (!err || err.status) {
        return err;
    }

    if (IsClientSaveFileError(err)) {
        return CreateApiError(typeof err === 'string' ? err : err.message, 400, 'invalid_save_file_request', err);
    }

    return err;
};

router.get('/', function(req, res, next) {

    RequireUserAndGameKey(req, function(err, userId, eGameKey) {
        if (err) {
            return next(err);
        }

        console.log('Normal save-file restore lookup started for user_id=' + userId + ', file_id=' + eGameKey.fileId + ', system=' + eGameKey.system);

        SaveFilesService.GetInitialSaveFiles(userId, eGameKey, function(getErr, saveFilesResult) {
            if (getErr) {
                console.log('Normal save-file download failed for user_id=' + userId + ', file_id=' + eGameKey.fileId + ':', getErr);
                return next(NormalizeRouteError(getErr));
            }

            SendCompressedApiResponse(res, next, saveFilesResult, userId, eGameKey);
        });
    });
});

router.post('/', function(req, res, next) {

    RequireUserAndGameKey(req, function(err, userId, eGameKey) {
        if (err) {
            return next(err);
        }

        console.log('Normal save-file upload route reached for user_id=' + userId + ', file_id=' + eGameKey.fileId + ', system=' + eGameKey.system + ', files=' + ((req.body && req.body.files && req.body.files.length) || 0));

        SaveFilesService.UpsertSaveFiles(userId, eGameKey, req.body, function(upsertErr, result) {
            if (upsertErr) {
                console.log('Normal save-file upload failed for user_id=' + userId + ', file_id=' + eGameKey.fileId + ':', upsertErr);
                return next(NormalizeRouteError(upsertErr));
            }

            SendCompressedApiResponse(res, next, result, userId, eGameKey);
        });
    });
});

module.exports = router;
