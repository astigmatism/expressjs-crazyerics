'use strict';
const express = require('express');
const router = express.Router();
const config = require('config');
const UserService = require('../services/users');
const SaveService = require('../services/saves');
const GameService = require('../services/games');
const CollectionService = require('../services/collections');
const UtilitiesService = require('../services/utilities');
const PreferencesService = require('../services/preferences');
const SyncService = require('../services/sync');


//at the same time we load the game's data file (locally or CDN) we update collections etc and return details/states
router.post('/load', function(req, res, next) {

    var gk = decodeURIComponent(req.query.gk);
    var gameKey = null;                 //of type GameKey (see utilities)
    var shader = req.body.shader;       //name of shader file to load
    var shaderFileSize = 0;

    //sanitize expected values
    try {
        gameKey = UtilitiesService.Decompress.gamekey(gk); //extract values
    }
    catch (e) {
        return next('The server failed to parse required post data or query strings.');
    }

    if (req.user && req.session) {

        //ensure a record of this game exists in the db (since I dynmically add them when consumed)
        GameService.PlayRequest(gameKey, function(err, titleRecord, fileRecord, details) {
            if (err) {
                return next(err);
            }
            
            //add to active collection
            CollectionService.PlayCollectionTitle(req.user.user_id, gameKey.gk, titleRecord.title_id, fileRecord.file_id, (err, result) => {

                //if a shader was selected, return its filesize for the progress bar
                if (shader) {
                    shaderFileSize = config.shaders.hasOwnProperty(shader) ? config.shaders[shader].s : 0;
                }

                //get saves used by this game
                SaveService.GetSavesForClient(req.user.user_id, fileRecord.file_id, function(err, savesForClientResults) {
                    if (err) {
                        return res.status(500).send(err);
                    }

                    //also return the game files used by this title (for selecting a different file to load)
                    GameService.GetGameDetails(gameKey, function(err, details) {
                        if (err) {
                            return res.json(err);
                        }

                        var result = {
                            saves: savesForClientResults,
                            files: details.files, //rom files
                            info: details.info, //thegamesdb data
                            size: details.size, //file size data
                            shaderFileSize: shaderFileSize //will be 0 if no shader to load
                        };

                        SyncService.Outgoing(result, req.user.user_id, (err, compressedResult) => {
                            if (err) {
                                return res.json(err);
                            }
                            res.json(compressedResult);
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
