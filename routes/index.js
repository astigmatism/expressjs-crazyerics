var express = require('express');
var fs = require('fs');
var jade = require('jade');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        layout: 'layout'
    });
});

router.get('/loademulator', function(req, res, next) {

	var emulator = req.query.emulator;
	var title = req.query.title;

	fs.readFile(__dirname + '/../views/emulators/' + emulator + '.jade', 'utf8', function (err, data) {
        if (err) {
        	console.log(err);
        	return res.send();
        }
        var fn = jade.compile(data);
        var html = fn({
        	title: title
        });
        res.send(html);
    });
});

router.get('/suggestions', function(req, res, next) {
    
    var system = req.query.system;
    var items = req.query.items || 10;
    var result = [];

    fs.readFile(__dirname + '/../data/' + system + '/search.json', 'utf8', function (err, data) {
        if (err) {
            return res.send(err);
        }
        try {
            data = JSON.parse(data);
        } catch (e) {
            return res.json(e);
        }

        var games = Object.keys(data);

        for (var i = 0; i < items; ++i) {
            result.push(games[games.length * Math.random() << 0]);
        }
        
        res.json(result);
    });

});

module.exports = router;
