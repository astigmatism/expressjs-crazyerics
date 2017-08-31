'use strict';
const express = require('express');
const router = express.Router();
const pug = require('pug');
const UtilitiesService = require('../services/utilities');
const SaveService = require('../services/saves');
const SyncService = require('../services/sync');

router.get('/', function(req, res, next) {

    var timestamp = req.query._;

    if (timestamp && req.user) {

        SaveService.GetSave(req.user.user_id, timestamp, function(err, compressedSaveState) {
            if (err) {
                return res.json({ error: err });
            }
            res.json({ state: compressedSaveState });
        });
    }
    else {
        res.json({ error: 'The required querystrings are not found.' });
    }
});

router.post('/', function(req, res, next) {

    //note: this route will have passed through sync (unpacked)

    var gk = decodeURIComponent(req.query.gk);
    var gameKey, body, saveType;

    try {
        gameKey = UtilitiesService.Decompress.gamekey(gk);
        body = req.body; 
        saveType = body.type;
    }
    catch (e) {
        return next(e);
    }

    if (gameKey && req.user && saveType && body.hasOwnProperty('timestamp') && body.hasOwnProperty('state') && body.hasOwnProperty('screenshot')) {

        SaveService.NewSave(req.user.user_id, gameKey, body.timestamp, body.screenshot, body.state, saveType, function(err, insertSaveRecord, prunedRecord) {
            if (err) {
                return res.json({ error: err });
            }

            //reduce amount of data for client (dont want to expose userid, etc)
            var result = {
                pruned: (prunedRecord) ? prunedRecord.client_timestamp : null,
                data: {
                    type: insertSaveRecord.type,
                    timestamp: insertSaveRecord.client_timestamp,
                    screenshot: insertSaveRecord.screenshot
                }
            };

            SyncService.Outgoing(result, req.user.user_id, (err, compressedResult) => {
                if (err) {
                    return res.json(err);
                }
                res.json(compressedResult);
            });
        });
    }
    else {
        next('the required data (body querystring) was not all present');
    }
});

router.delete('/', function(req, res, next) {
    //TODO
});

module.exports = router;