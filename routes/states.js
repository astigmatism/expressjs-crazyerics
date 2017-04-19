var express = require('express');
var pug = require('pug');
var UtilitiesService = require('../services/utilities.js');
var router = express.Router();
var config = require('config');

router.post('/save', function(req, res, next) {

    var key = decodeURIComponent(req.query.key);
    var postdata = UtilitiesService.decompress.json(req.body); //unpack form data

    if (req.session && postdata.hasOwnProperty('state') && postdata.hasOwnProperty('screenshot')) {
        
        var maxsaves = config.get('assetpath');

        var saveType = postdata.type; //user, system...

        //create strcture for states if this is first time
        req.session.games = req.session.games ? req.session.games : {};
        req.session.games[key] = req.session.games[key] ? req.session.games[key] : {};
        req.session.games[key].saves = req.session.games[key].saves ? req.session.games[key].saves : {};
        req.session.games[key].saves[saveType] = req.session.games[key].saves[saveType] ? req.session.games[key].saves[saveType] : {};
        
        var stack = req.session.games[key].saves[saveType];
        var keys = Object.keys(stack);
        var deletekey = null;
        var max = maxsaves.hasOwnProperty(saveType) ? maxsaves[saveType] : 1;

        //before, adding ensure user does not exceed limit
        if (keys.length + 1 > max) {
            
            //find oldest, sort keys smallest to greatest
            keys.sort(function(a, b) {
              return a - b;
            });

            delete stack[keys[0]];
            deletekey = keys[0];
        }

        var savedDate = Date.now();

        var save = {
            state: postdata.state,
            screenshot: postdata.screenshot
        };

        console.log(save);

        //use the date as a key for this saves data
        stack[savedDate] = save;

        return res.json({
            save: save,
            key: savedDate,
            deletekey: deletekey,
            used: keys.length + 1,
            max: max
        });
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