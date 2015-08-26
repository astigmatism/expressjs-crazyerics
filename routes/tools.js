var express = require('express');
var fs = require('fs');
var async = require('async');
var router = express.Router();
var config = require('../config.js');
var UtilitiesService = require('../services/utilities');

router.get('/all', function(req, res, next) {

    result = {};

    //open the data dir
    fs.readdir(__dirname + '/../data', function(err, systems) {
        if (err) {
            return callback(err);
        }

        //loop over each system
        async.eachSeries(systems, function(system, nextsystem) {

            //pass over "all" folder
            if (system === 'all') {
                return nextsystem();
            }

            //read the genreated search.json file
            fs.readFile(__dirname + '/../data/' + system + '/searchofficial.json', 'utf8', function(err, content) {

                try {
                    content = JSON.parse(content);
                } catch (e) {
                    return res.json(e);
                }

                //add each game to the result, add a system property
                for (game in content) {
                    
                    var temp = content[game];
                    temp.s = system;
                    result[game] = temp;
                }
                
                return nextsystem();

            });

        }, function(err) {
            if (err) {
                res.json(err);
            }
            var path = __dirname + '/../data/all/search.json';
            fs.writeFile(path, JSON.stringify(result), function(error) {
                if (err) {
                    return res.json(err);
                }
                res.json('File ' + path + ' written');
            });
        });
    });
});

module.exports = router;
