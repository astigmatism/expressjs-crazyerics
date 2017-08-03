var express = require('express');
var router = express.Router();
var config = require('config');
var SaveService = require('../services/saves.js');
var GameService = require('../services/games.js');
var CollectionService = require('../services/collections.js');
var UtilitiesService = require('../services/utilities.js');

//at the same time we load the game's data file (locally or CDN) we run to the server to
//let it know a game was loaded and respond with states
router.post('/load', function(req, res, next) {

    var key = null;
    var game = null; //will be { system: , title: , file: }
    var shader = req.body.shader; //if we are to load a shader definition with this game, it was passed here
    var savePreference = req.body.savePreference; //should we save this shader selection for all games of this system?
    var saves = {};
    var shaderFileSize = 0;

    //sanitize expected values
    if (req.body.key) {
        try {
            key = decodeURIComponent(req.body.key); //key has been uriencoded, compressed and base64 encoded
            game = UtilitiesService.decompress.json(key); //extract values
        }
        catch (e) {
            return res.json('The server failed to parse the key: ' + key + '. Is it in a valid format?');
        }
    }
    else {
        return res.json('The server was expecting a key value in POST data.');
    }

    //boolean correction
    savePreference = (savePreference === 'true') ? true : false;

    //ensure a record of this game exists
    GameService.PlayRequest(key, function(err, details) {
        if (err) {
            res.status(500).send(err);
        }
            
        if (req.session) {

            CollectionService.UpdateCollection(req.sessionID, 'Recently Played', key, (err, result) => {

                //create games and history objects if not in session memory
                req.session.games = req.session.games ? req.session.games : {};
                req.session.games.history = req.session.games.history ? req.session.games.history : {};

                //this is override the same key (game) with more recent data
                if (key in req.session.games.history) {

                } else {
                    req.session.games.history[key] = {
                        system: game.system,
                        title: game.title,
                        file: game.file
                    }
                }
                req.session.games.history[key].played = Date.now();

                //did the user check the box for using this shader for all future system games?
                if (savePreference) {
                    req.session.shaders = req.session.shaders ? req.session.shaders : {};
                    req.session.shaders[game.system] = shader;
                }

                //if a shader was selected, return its filesize for the progress bar
                if (shader) {
                    shaderFileSize = config.shaders[shader].s;
                }

                //get saves used by this game
                SaveService.GetSavesForClient(req.sessionID, key, function(err, saveDocs) {
                    if (err) {
                        //there's really nothing I can do at this point, simply return a null set of saves
                        saveDocs = {};
                    }

                    //also return the game files used by this title (for selecting a different file to load)
                    GameService.GetGameDetails(game.system, game.title, game.file, function(err, details) {
                        if (err) {
                            return res.json(err);
                        }

                        var result = {
                            saves: saveDocs,
                            files: details.files, //rom files
                            info: details.info, //thegamesdb data
                            size: details.size, //file size data
                            shaderFileSize: shaderFileSize //will be 0 if no shader to load
                        };

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
