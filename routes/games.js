var express = require('express');
var router = express.Router();
var config = require('config');
var UserService = require('../services/users.js');
var SaveService = require('../services/saves.js');
var GameService = require('../services/games.js');
var CollectionService = require('../services/collections.js');
var UtilitiesService = require('../services/utilities.js');

//at the same time we load the game's data file (locally or CDN) we run to the server to
//let it know a game was loaded and respond with states
router.post('/load', function(req, res, next) {

    var key = decodeURIComponent(req.query.gk);
    var game = null; //will be { system: , title: , file: }
    var shader = req.body._;        //name of shader file to load
    var preferences = req.body.__;  //payload of user preferences to save back
    var shaderFileSize = 0;

    //sanitize expected values
    try {
        game = UtilitiesService.decompress.json(key); //extract values
        
        if (preferences) {
            preferences =  UtilitiesService.decompress.json(preferences);
        }
    }
    catch (e) {
        return res.json('The server failed to parse required post data or query strings.');
    }

    //shader payload

    //ensure a record of this game exists
    GameService.PlayRequest(key, function(err, titleRecord, fileRecord, details) {
        if (err) {
            return res.status(500).send(err);
        }
            
        if (req.user && req.session) {

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

                    UserService.UpdatePlayerPreferences(req.session.id, req.user.user_id, preferences, (err, updateResult) => {
                        if (err) {
                            return callback(err);
                        }
                        res.json(UtilitiesService.compress.json(result));
                    });
                });
            });
        }
        else {
            res.status(500).send('Session not found in request');
        }

    });
});

router.get('/layout/controls/:system', function(req, res, next) {

    var system = req.params.system;
    res.render('controls/' + system);
});

module.exports = router;
