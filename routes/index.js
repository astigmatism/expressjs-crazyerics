var express = require('express');
var UtilitiesService = require('../services/utilities.js');
var pako = require('pako');
var atob = require('atob');
var router = express.Router();

router.get('/', function(req, res, next) {

    UtilitiesService.collectDataForClient(req, null, function(err, clientdata) {
        if (err) {
            return res.json(err);
        }
        res.render('index', {
            layout: 'layout',
            clientdata: clientdata
        });
    });
});

router.get('/search/:system/:query', function(req, res, next) {

    var system = req.params.system;
    var term = req.params.query || '';

    UtilitiesService.search(system, term, null, function(err, result) {
        if (err) {
            return res.json(err);
        }
        var compressed = UtilitiesService.compress.json(result);
        res.json(compressed);
    });
});

router.get('/load/:system/:title/:file', function(req, res, next) {

    var system = req.params.system;
    var title = req.params.title;
    var file = req.params.file;

    UtilitiesService.loadGame(system, title, file, function(err, content) {
        if (err) {
            return res.json(err);
        }

        UtilitiesService.setPlayHistory(req, system, title, file, true, function(err, ph) {
            if (err) {
                return res.json(err);
            }
            res.send(content);
        });
    });
});

router.get('/load/emulator/:system', function(req, res, next) {

    var system = req.params.system;

    res.render('emulators/' + system);
});

router.get('/layout/controls/:system', function(req, res, next) {

    var system = req.params.system;
    res.render('controls/' + system);
});

router.get('/:wildcard', function(req, res, next) {

    var wildcard = req.params.wildcard;
    var routes = [];

    try {
        routes = decodeURI(pako.inflate(atob(wildcard), {to: 'string'})).split('/'); //lots of steps ;)
    } catch (e) {
        return res.json(e);
    }

    if (routes.length === 3) {

        var system = routes[0];
        var title = routes[1];
        var file = routes[2];

        UtilitiesService.collectDataForClient(req, {
            system: system,
            title: title,
            file: file
        }, function(err, clientdata) {
            if (err) {
                return res.json(err);
            }

            UtilitiesService.setPlayHistory(req, system, title, file, true, function(err, ph) {
                if (err) {
                    return res.json(err);
                }

                return res.render('index', {
                    layout: 'layout',
                    clientdata: clientdata
                });
            });
        });
    } else {
        res.json('wildcard did not contain expected data: ' + routes.toString());
    }
});

module.exports = router;
