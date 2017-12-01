'use strict';
const express = require('express');
const router = express.Router();
const pug = require('pug');
const UtilitiesService = require('../services/utilities');
const GamesService = require('../services/games');
const SaveService = require('../services/saves');
const SyncService = require('../services/sync');

//get a save record (requesting to load)
router.get('/', function(req, res, next) {

    //when getting a save record, the timestamp is unique enough amongst all the saves for this given fileId
    var gameKey;
    var gk = decodeURIComponent(req.query.gk);
    var timestamp = req.query.ts;
    
    try {
        gameKey = UtilitiesService.Decompress.gamekey(gk);
    }
    catch (e) {
        return next(e);
    }

    if (timestamp && req.user && gameKey) {

        var userId = req.user.user_id;
        
        GamesService.EnhancedGameKey(gameKey, (err, eGameKey) => {
            if (err) return next(err);

            SaveService.GetSave(userId, eGameKey, timestamp, function(err, saveStateBinary) {
                if (err) return next(err);
                
                res.json({ 
                    state: saveStateBinary 
                });
            });
        });
    }
    else {
        return next('The required input data was not present');
    }
});

//a new save created in the client
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

        var userId = req.user.user_id;
        
        GamesService.EnhancedGameKey(gameKey, (err, eGameKey) => {
            if (err) return next(err);

            SaveService.NewSave(userId, eGameKey, body.timestamp, body.screenshot, body.state, saveType, (err) => {
                if (err) return next(err);

                SyncService.Outgoing({}, userId, eGameKey, (err, compressedResult) => {
                    if (err) return res.json(err);
                    
                    res.json(compressedResult);
                });
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