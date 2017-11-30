var express = require('express');
var router = express.Router();
var config = require('config');
var UtilitiesService = require('../services/utilities.js');
var FeaturedService = require('../services/featured.js');

router.post('/', function(req, res, next) {

    var name = req.body.name;
    var gks = req.body.gks;

    FeaturedService.Create(name, gks, (err, result) => {
        if (err) return res.json(err)
        res.json(UtilitiesService.Compress.json({}));
    });
});

module.exports = router;
