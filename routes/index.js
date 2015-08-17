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

module.exports = router;
