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

				result[item].playable = _goodromsfilter(files, 'nes');

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

router.get('/snes', function(req, res, next) {
    
	var result = {};

	fs.readdir(__dirname + '/../public/roms/snes', function (err, dirs) { 
		if (err) {
			res.json(err);
			return;
		}

		async.each(dirs, function(item, callback) {

			if (item.indexOf('.') === 0) {
				callback();
				return;
			}

			fs.stat(__dirname + '/../public/roms/snes/' + item, function (err, stats) {
		        if (err) {
		            return console.log(err);
		        }

		        if (stats.isFile()) {
		        	
		        	console.log(item + ' ---> ' + item.replace(/\..{3}$/i,'').replace(/\(.{1}\)/g,'').replace(/\[.*\]/g,''));

		   //      	var dirname = item.replace(/\..{3}$/i,'').replace(/\(.{1}\)/g,'').replace(/\[.*\]/g,'');

		   // 			fs.mkdirSync(__dirname + '/../public/roms/snes2/' + dirname);
		   //       	fs.rename(__dirname + '/../public/roms/snes/' + item, __dirname + '/../public/roms/snes2/' + dirname + '/' + item, function(err){
					//  	if(err)
					//  		throw err;
					// });

		   //      	callback();

		        }

		        if (stats.isDirectory()) {
		            
		            result[item] = {};

					fs.readdir(__dirname + '/../public/roms/snes/' + item, function (err, files) {
						if (err) {
							return callback(err);
						}

						var games = [];

						for (var j = 0; j < files.length; ++j) {
							games.push(files[j])
						}

						result[item].games = games;

						result[item].playable = _goodromsfilter(files, 'smc');

						callback();
					});

		        }
		    });


		}, function(err) {
			if (err) {
				return res.json(err);
			}

			res.json(result);
		});
	});
});

router.get('/all', function(req, res, next) {
    
	var result = {};

	fs.readdir(__dirname + '/../public/roms/', function (err, systems) { 
		if (err) {
			return res.json(err);
		}

		async.each(systems, function(system, callbacksystem) {

			if (system.indexOf('.') === 0) {
				return callbacksystem();
			}

			fs.readdir(__dirname + '/../public/roms/' + system, function (err, games) {
				if (err) {
					return res.json(err);
				}

				async.each(games, function(game, callback) {

					if (game.indexOf('.') === 0) {
						return callback();
					}

					result[game] = {};

					fs.readdir(__dirname + '/../public/roms/' + system + '/' + game, function (err, files) {
						if (err) {
							return res.json(err);
						}

						var games = [];

						for (var j = 0; j < files.length; ++j) {
							games.push(files[j])
						}

						result[game].games = games;

						var ext = '';
						switch(system) {
							case 'nes':
								ext = 'nes';
								break;
							case 'snes':
								ext = 'smc';
								break;
						}

						result[game].playable = _goodromsfilter(files, ext);

						result[game].system = system;

						callback();
					});


				}, function(err) {
					if (err) {
						return res.json(err);
					}

					callbacksystem();
				});
			});
		}, function(err) {
			if (err) {
				return res.json(err);
			}

			res.json(result);
		});
	});
});

var _goodromsfilter = function(files, ext) {

	var us_reg = new RegExp('\\(u\\)', 'ig');
	var us_alt_reg = new RegExp('\\[u\\]', 'ig');
	var w_reg = new RegExp('\\(w\\)', 'ig');
	var e_reg = new RegExp('\\(e\\)', 'ig');
	var ju_reg = new RegExp('\\(ju\\)', 'ig');
	var pl_reg = new RegExp('\\[!\\]', 'ig');
	var nob_reg = new RegExp('\\[', 'ig');
	var ends = new RegExp('\\.' + ext + '$', 'ig');
	
	var playable = null;

	for (j = 0; j < files.length; ++j) {
		
		//if u and !
		if ((files[j]).match(us_reg) && (files[j]).match(pl_reg) && (files[j]).match(ends)) {
			playable = files[j];
			break;
		}
	}
	if (!playable) {
		// ju and !
		for (j = 0; j < files.length; ++j) {
			if ((files[j]).match(ju_reg) && (files[j]).match(pl_reg) && (files[j]).match(ends)) {
				playable = files[j];
				break;
			}
		}
	}
	if (!playable) {
		// u alt and !
		for (j = 0; j < files.length; ++j) {
			if ((files[j]).match(us_alt_reg) && (files[j]).match(pl_reg) && (files[j]).match(ends)) {
				playable = files[j];
				break;
			}
		}
	}
	if (!playable) {
		// w and !
		for (j = 0; j < files.length; ++j) {
			if ((files[j]).match(w_reg) && (files[j]).match(pl_reg) && (files[j]).match(ends)) {
				playable = files[j];
				break;
			}
		}
	}
	if (!playable) {
		// [!] //playable
		for (j = 0; j < files.length; ++j) {
			if ((files[j]).match(pl_reg) && (files[j]).match(ends)) {
				playable = files[j];
				break;
			}
		}
	}
	if (!playable) {
		// u and no brackets
		for (j = 0; j < files.length; ++j) {
			if ((files[j]).match(us_reg) && !(files[j]).match(nob_reg) && (files[j]).match(ends)) {
				playable = files[j];
				break;
			}
		}
	}
	if (!playable) {
		// ju and no brackets
		for (j = 0; j < files.length; ++j) {
			if ((files[j]).match(ju_reg) && !(files[j]).match(nob_reg) && (files[j]).match(ends)) {
				playable = files[j];
				break;
			}
		}
	}
	if (!playable) {
		// u alt and no brackets
		for (j = 0; j < files.length; ++j) {
			if ((files[j]).match(us_alt_reg) && !(files[j]).match(nob_reg) && (files[j]).match(ends)) {
				playable = files[j];
				break;
			}
		}
	}
	if (!playable) {
		// w and no brackets
		for (j = 0; j < files.length; ++j) {
			if ((files[j]).match(w_reg) && !(files[j]).match(nob_reg) && (files[j]).match(ends)) {
				playable = files[j];
				break;
			}
		}
	}
	if (!playable) {
		// u 
		for (j = 0; j < files.length; ++j) {
			if ((files[j]).match(us_reg) && (files[j]).match(ends)) {
				playable = files[j];
				break;
			}
		}
	}
	if (!playable) {
		// ju 
		for (j = 0; j < files.length; ++j) {
			if ((files[j]).match(ju_reg) && (files[j]).match(ends)) {
				playable = files[j];
				break;
			}
		}
	}
	if (!playable) {
		// u alt
		for (j = 0; j < files.length; ++j) {
			if ((files[j]).match(us_alt_reg) && (files[j]).match(ends)) {
				playable = files[j];
				break;
			}
		}
	}
	if (!playable) {
		// w
		for (j = 0; j < files.length; ++j) {
			if ((files[j]).match(w_reg) && (files[j]).match(ends)) {
				playable = files[j];
				break;
			}
		}
	}
	if (!playable) {
		// e
		for (j = 0; j < files.length; ++j) {
			if ((files[j]).match(e_reg) && (files[j]).match(ends)) {
				playable = files[j];
				break;
			}
		}
	}
	if (!playable) {
		//no brackets
		for (j = 0; j < files.length; ++j) {
			if (!(files[j]).match(nob_reg) && (files[j]).match(ends)) {
				playable = files[j];
				break;
			}
		}
	}
	if (!playable) {
		playable = files[0];
	}

	return playable;
};

module.exports = router;
