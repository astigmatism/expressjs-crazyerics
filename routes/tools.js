var express = require('express');
var fs = require('fs');
var async = require('async');
var router = express.Router();

router.get('/nes', function(req, res, next) {
    
	var result = {};

	fs.readdir(__dirname + '/../public/roms/nes', function (err, dirs) { 
		if (err) {
			res.json(err);
			return;
		}

		async.each(dirs, function(item, callback) {

			if (item.indexOf('.') === 0) {
				callback();
				return;
			}

			result[item] = {};

			fs.readdir(__dirname + '/../public/roms/nes/' + item, function (err, files) {
				if (err) {
					return callback(err);
				}

				var games = [];

				for (var j = 0; j < files.length; ++j) {
					games.push(files[j])
				}

				result[item].games = games;

				//find playable rom
				
				var us_reg = new RegExp('(u)', 'ig');
				var w_reg = new RegExp('(w)', 'ig');
				var pl_reg = new RegExp('[!]', 'ig');
				var nob_reg = new RegExp('\\[', 'ig');
				
				var playable = null;

				for (j = 0; j < files.length; ++j) {
					
					//if u and !
					if (us_reg.test(files[j]) && pl_reg.test(files[j])) {
						playable = files[j];
						break;
					}
				}
				if (!playable) {
					// w and !
					for (j = 0; j < files.length; ++j) {
						if (w_reg.test(files[j]) && pl_reg.test(files[j])) {
							playable = files[j];
							break;
						}
					}
				}
				if (!playable) {
					// !
					for (j = 0; j < files.length; ++j) {
						if (pl_reg.test(files[j])) {
							playable = files[j];
							break;
						}
					}
				}
				if (!playable) {
					// u
					for (j = 0; j < files.length; ++j) {
						if (us_reg.test(files[j])) {
							playable = files[j];
							break;
						}
					}
				}
				if (!playable) {
					// w
					for (j = 0; j < files.length; ++j) {
						if (w_reg.test(files[j])) {
							playable = files[j];
							break;
						}
					}
				}
				if (!playable) {
					//no brackets
					for (j = 0; j < files.length; ++j) {
						if (!nob_reg.test(files[j])) {
							playable = files[j];
							break;
						}
					}
				}
				if (!playable) {
					playable = files[0];
				}
				result[item].playable = playable;


				callback();
			});


		}, function(err) {
			if (err) {
				return res.json(err);
			}

			res.json(result);
		});
	});
});

module.exports = router;
