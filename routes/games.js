'use strict';
const express = require('express');
const router = express.Router();
const config = require('config');
const UserService = require('../services/users');
const SaveService = require('../services/saves');
const SaveFilesService = require('../services/savefiles');
const GameService = require('../services/games');
const CollectionService = require('../services/collections');
const UtilitiesService = require('../services/utilities');
const PreferencesService = require('../services/preferences');
const SyncService = require('../services/sync');


//at the same time we load the game's data file (locally or CDN) we update collections etc and return details/states
router.post('/load', function(req, res, next) {

    var gk = decodeURIComponent(req.query.gk);
    var gameKey = null;                 //of type GameKey (see utilities)

    //sanitize expected values
    try {
        gameKey = UtilitiesService.Decompress.gamekey(gk); //extract values
    }
    catch (e) {
        return next('The server failed to parse required post data or query strings.');
    }

    if (req.user && req.session && gameKey) {

        var userId = req.user.user_id;        
        
        //ensure a record of this game exists in the db (since I dynmically add them when consumed)
        GameService.PlayRequest(gameKey, function(err, eGameKey, gameDetails) {
            if (err) return next(err);

            var _isPlayingTopRanked = (gameDetails.file == gameDetails.toprank);

            //add a record for this user playing this title
            UserService.PlayTitle(userId, eGameKey, _isPlayingTopRanked, (err, userTitleRecord) => {
                if (err) return next(err);

                //add to active collection, if already there, no problem
                CollectionService.AddTitle(userId, eGameKey, (err, addTitleResult) => {
                    if (err) return next(err);
                    
                    //rebuilds cache of saves for this file and sets the flag to update the client through sync
                    SaveService.Sync.Outgoing(userId, eGameKey, (err, initialSaveData) => {
                        if (err) return next(err);

                        SaveFilesService.GetInitialSaveFiles(userId, eGameKey, (saveFilesErr, initialSaveFiles) => {
                            if (saveFilesErr) {
                                // Normal in-game saves should not block launching a game. A missing
                                // migration or temporary DB error is logged and the browser-local IDBFS
                                // layer can still preserve progress until server sync is fixed.
                                console.log('Normal save-file preload failed for user_id=' + userId + ', file_id=' + eGameKey.fileId + ':', saveFilesErr);
                                initialSaveFiles = {
                                    context: SaveFilesService.BuildContext(userId, eGameKey),
                                    files: [],
                                    error: 'Normal save-file preload failed; using browser-local saves only for this launch.'
                                };
                            }

                            var result = {
                                saves: initialSaveData,                 //emulator save-state data
                                saveFiles: initialSaveFiles.files,      //normal in-game save data
                                saveFileContext: initialSaveFiles.context,
                                saveFileError: initialSaveFiles.error || null,
                                files: gameDetails.files,               //rom files
                                info: gameDetails.info                  //thegamesdb data
                            };
        
                            SyncService.Outgoing(result, userId, eGameKey, (err, compressedResult) => {
                                if (err) return res.json(err);
                                
                                res.json(compressedResult);
                            });
                        });
                    });
                });
            });
        });
    }
    else {
        return next('No user or session on request');
    }
});

router.get('/layout/controls/:system', function(req, res, next) {

    var system = req.params.system;
    res.render('controls/' + system);
});

module.exports = router;
