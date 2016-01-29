var express = require('express');
var router = express.Router();
var UtilitiesService = require('../services/utilities.js');

router.get('/:key', function(req, res, next) {

    var key = req.params.key;

    UtilitiesService.getShader(key, function(err, content) {
        if (err) {
            return res.json({}); //return empty json on error
        }
        res.json(content);
    });
});

module.exports = router;
