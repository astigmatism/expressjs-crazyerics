var express = require('express');
var pug = require('pug');
var UtilitiesService = require('../services/utilities.js');
var router = express.Router();
var SaveService = require('../services/saveservice.js');

router.post('/save', function(req, res, next) {

    var key = decodeURIComponent(req.query.key);
    var saveName = Date.now();
    var postdata = UtilitiesService.decompress.json(req.body); //unpack form data
    var saveType = postdata.type; //user, auto...
    var deletekey = null;

    if (req.session && key && saveType && postdata.hasOwnProperty('state') && postdata.hasOwnProperty('screenshot')) {
        
        //create strcture for saves in session data if this is first time
        req.session.games = req.session.games ? req.session.games : {};
        req.session.games[key] = req.session.games[key] ? req.session.games[key] : {};
        req.session.games[key].saves = req.session.games[key].saves ? req.session.games[key].saves : [];

        var sessionSaves = req.session.games[key].saves;

        //save the screen and state data. response is the _id from the insert into the mongo collection
        SaveService.NewSave(req.sessionID, key, saveName, postdata.screenshot, postdata.state, saveType, function(err, saveId) {

            //if there was a dbx error in writing the file, we have to throw this save away
            if (err) {
                console.log (err);
                return res.json({
                    error: err
                });
            }

            //ok, now add the saveName as a key to the file in session data
            sessionSaves.push(saveId);

            return res.json({
                
            });
        });

        /*
        //ok! what do to here. I save the screen and state data as a file on dropbox. why? because its heavy and mongo (session) has a 16MB limit on docs
        //because of this, I tag the save with a name (a timestamp) and save that reference to mongo on the session


        //create strcture for saves in session data if this is first time
        req.session.games = req.session.games ? req.session.games : {};
        req.session.games[key] = req.session.games[key] ? req.session.games[key] : {};
        req.session.games[key].saves = req.session.games[key].saves ? req.session.games[key].saves : [];

        var sessionSaves = req.session.games[key].saves;

        //save the screen and state data. response is the dropbox plugin response (includes file write data)
        SaveService.NewSave(req.sessionID, key, saveName, postdata.screenshot, postdata.state, saveType, function(err, response) {

            //if there was a dbx error in writing the file, we have to throw this save away
            if (err) {
                console.log (err);
                return res.json({
                    error: err
                });
            }

            //ok, now add the saveName as a key to the file in session data
            sessionSaves.push(saveName);

            //do we need to prune the total?
            if (sessionSaves.length > maxsaves) {

                //sort oldest to newest
                keys.sort(function(a, b) {
                    return a - b;
                });

                deletekey = sessionSaves[0];
            }

            //because we're async here, I need to wait for a response.
            //bails if delete key is null
            SaveService.DeleteSave(req.sessionID, key, deletekey, function(err, response, deleted) {

                //again, bail on error
                if (err) {
                    console.log (err);
                    return res.json({
                        error: err
                    });
                }
                
                //delete was successful
                if (deleted) {
                    sessionSaves.shift(); //removes 0 index
                }

                //ok! with delete (or no delete, just the save) complete we can respond to the client
                return res.json({
                    deletekey: deletekey,
                    used: sessionSaves.length,
                    max: max
                });
            });
        });
        */
    }
    res.json();
});

router.delete('/delete', function(req, res, next) {

    var key = decodeURIComponent(req.query.key);

    if (req.session) {
        if (req.session.games && req.session.games[key] && req.session.games[key]) {
             delete req.session.games[key];
        }

        if (req.session.games.history && req.session.games.history[key]) {
            delete req.session.games.history[key]
        }
    }
    res.json();
    
});

module.exports = router;