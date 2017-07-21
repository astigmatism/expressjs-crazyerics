var express = require('express');
var pug = require('pug');
var CollectionsService = require('../services/collections.js');
var router = express.Router();


//stubbed at the moment. I'd like to have this feature working, but probably after other goals

router.get('/', function(req, res, next) {

});

router.post('/save', function(req, res, next) {
    
});

module.exports = router;