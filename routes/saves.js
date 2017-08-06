var express = require('express');
var pug = require('pug');
var UtilitiesService = require('../services/utilities.js');
var router = express.Router();
var SaveService = require('../services/saves.js');

router.get('/', function(req, res, next) {

    var timestamp = req.query._;

    if (timestamp && req.user) {

        SaveService.GetSave(req.user.user_id, timestamp, function(err, compressedSaveState) {
            if (err) {
                return res.json({ error: err });
            }
            res.json({ state: compressedSaveState });
        });
    }
    else {
        res.json({ error: 'The required querystrings are not found.' });
    }
});

router.post('/', function(req, res, next) {

    var gameKey = decodeURIComponent(req.query.gk);
    var postdata = UtilitiesService.decompress.json(req.body); //unpack form data
    var saveType = postdata.type; //user, auto...
    var game = UtilitiesService.decompress.json(gameKey);

    if (req.user && game.title && game.file && saveType && postdata.hasOwnProperty('timestamp') && postdata.hasOwnProperty('state') && postdata.hasOwnProperty('screenshot')) {

        SaveService.NewSave(req.user.user_id, game.system, game.title, game.file, postdata.timestamp, postdata.screenshot, postdata.state, saveType, function(err, insertSaveRecord, prunedRecord) {
            if (err) {
                return res.json({ error: err });
            }

            //reduce amount of data for client (dont want to expose userid, etc)
            var result = ({
                type: insertSaveRecord.type,
                timestamp: insertSaveRecord.client_timestamp,
                screenshot: insertSaveRecord.screenshot
            });

            return res.json({
                __: (prunedRecord) ? prunedRecord.client_timestamp : null,
                _: result
            });
        });
    }
    else {
        res.json({
            error: 'the required data (postdata querystring) was not all present'
        });
    }
});

router.delete('/', function(req, res, next) {
    //TODO
});

module.exports = router;