const express = require('express');
const router = express.Router();
const config = require('config');
const UserService = require('../services/users.js');
const SaveService = require('../services/saves.js');
const GameService = require('../services/games.js');
const CollectionService = require('../services/collections.js');
const UtilitiesService = require('../services/utilities.js');
const PreferencesService = require('../services/preferences.js')


//at the same time we load the game's data file (locally or CDN) we update collections etc and return details/states
router.post('/load', function(req, res, next) {

    var key = decodeURIComponent(req.query.gk);
    var game = null;                    //will be { system: , title: , file: }
    var shader = req.body.shader;       //name of shader file to load
    var shaderFileSize = 0;

    //sanitize expected values
    try {
        game = UtilitiesService.decompress.json(key); //extract values
    }
    catch (e) {
        return next('The server failed to parse required post data or query strings.');
    }

    if (req.user && req.session) {

        //ensure a record of this game exists in the db (since I dynmically add them when consumed)
        GameService.PlayRequest(key, function(err, titleRecord, fileRecord, details) {
            if (err) {
                return next(err);
            }
            
            //add to active collection

            //CollectionService.UpdateCollection(req.sessionID, 'Recently Played', key, (err, result) => {

                //create games and history objects if not in session memory
                // req.session.games = req.session.games ? req.session.games : {};
                // req.session.games.history = req.session.games.history ? req.session.games.history : {};

                //this is override the same key (game) with more recent data
                //if (key in req.session.games.history) {

                // } else {
                //     req.session.games.history[key] = {
                //         system: game.system,
                //         title: game.title,
                //         file: game.file
                //     }
                // }
                // req.session.games.history[key].played = Date.now();

                //did the user check the box for using this shader for all future system games?
                // if (savePreference) {
                //     req.session.shaders = req.session.shaders ? req.session.shaders : {};
                //     req.session.shaders[game.system] = shader;
                // }

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
                GameService.GetGameDetails(game.system, game.title, game.file, function(err, details) {
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

                    res.json(UtilitiesService.Compress.json(result));
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
