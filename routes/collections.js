'use strict';
const express = require('express');
const router = express.Router();
const config = require('config');
const GamesService = require('../services/games');
const CollectionsService = require('../services/collections');
const UtilitiesService = require('../services/utilities');
const SyncService = require('../services/sync');

//stubbed at the moment. I'd like to have this feature working, but probably after other goals

router.get('/', function(req, res, next) {

});

router.post('/save', function(req, res, next) {
    
});

router.delete('/game', function(req, res, next) {

    //before we can delete, ensure all the following
    var gk = decodeURIComponent(req.query.gk);
    var gameKey;

    //sanitize expected values
    try {
        gameKey = UtilitiesService.Decompress.gamekey(gk); //extract values
    }
    catch (e) {
        return next('The server failed to parse required post data or query strings.');
    }

    if (req.user && req.session && gameKey) {

        var userId = req.user.user_id;

        GamesService.EnhancedGameKey(gameKey, (err, eGameKey) => {
            if (err) {
                return next(err);
            }

            //the service will get the active collection for this user
            CollectionsService.DeleteCollectionTitle(userId, eGameKey, (err) => {
                if (err) {
                    return next(err);
                }
                
                SyncService.Outgoing({}, userId, eGameKey, (err, compressedResult) => {
                    if (err) {
                        return res.json(err);
                    }
                    res.json(compressedResult);
                });
            });
        });
    }
});

module.exports = router;