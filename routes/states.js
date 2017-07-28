var express = require('express');
var pug = require('pug');
var UtilitiesService = require('../services/utilities.js');
var router = express.Router();
var SaveService = require('../services/saves.js');

router.get('/', function(req, res, next) {

    var gameKey = decodeURIComponent(req.query.gk);
    var timeStamp = req.query.timeStamp;

    if (gameKey && timeStamp) {

        SaveService.GetState(req.sessionID, gameKey, timeStamp, function(err, result) {
            if (err) {
                return res.json({ error: err });
            }
            res.json(result);
        });
    }
    else {
        res.json({ error: 'The required querystrings are not found.' });
    }
});

router.post('/save', function(req, res, next) {

    var gameKey = decodeURIComponent(req.query.gk);
    var timeStamp = Date.now();
    var postdata = UtilitiesService.decompress.json(req.body); //unpack form data
    var saveType = postdata.type; //user, auto...

    if (req.session && gameKey && saveType && postdata.hasOwnProperty('state') && postdata.hasOwnProperty('screenshot')) {
        
        //create strcture for saves in session data if this is first time
        req.session.games = req.session.games ? req.session.games : {};
        req.session.games[gameKey] = req.session.games[gameKey] ? req.session.games[gameKey] : {};
        req.session.games[gameKey].saves = req.session.games[gameKey].saves ? req.session.games[gameKey].saves : [];

        var sessionSaves = req.session.games[gameKey].saves;

        //save the screen and state data. response is the _id from the insert into the mongo collection
        SaveService.NewSave(req.sessionID, gameKey, timeStamp, postdata.screenshot, postdata.state, saveType, function(err, saveId, deleteSaveTimeStamp) {

            //if there was a dbx error in writing the file, we have to throw this save away
            if (err) {
                console.log (err);
                return res.json({
                    error: err
                });
            }

            //ok, now add the timeStamp as a gameKey to the file in session data
            sessionSaves.push(saveId);

            return res.json({
                ds: deleteSaveTimeStamp,
                ts: timeStamp
            });
        });
    }
    else {
        res.json({
            error: 'the required data (postdata querystring) was not all present'
        });
    }
});

router.delete('/delete', function(req, res, next) {

    var gameKey = decodeURIComponent(req.query.gk);

    //remove game from session data
    if (req.session) {
        if (req.session.games && req.session.games[gameKey] && req.session.games[gameKey]) {
             delete req.session.games[gameKey];
        }

        if (req.session.games.history && req.session.games.history[gameKey]) {
            delete req.session.games.history[gameKey]
        }
    }

    //remove all saves
    SaveService.DeleteAllGameSaves(req.sessionID, gameKey, function(err, result) {
        if (err) {
            return res.json({ error: err });
        }
        res.json();
    });
    
});

module.exports = router;