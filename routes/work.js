var express = require('express');
var router = express.Router();
var config = require('config');
var fs = require('fs');
var DataService = require('../services/data.js');
var async = require('async');

router.get('/emulatorprep', function(req, res, next) {

    var sourcePath = __dirname + '/../workspace/2016-10-20_RetroArch/';
    var destinationPath = __dirname + '/../public/emulators/2.0.0/';

    //open source folder
    fs.readdir(sourcePath, function(err, emulatorfiles) {
        if (err) {
            return res.json(err);
        }

        //passing true to second param says to overwrite on exist
        DataService.createFolder(destinationPath, true, function(err) {
            if (err) {
                return res.json(err);
            }

            //loop over all file contents
            async.eachSeries(emulatorfiles, function(emulatorfile, nextemulatorfile) {

                fs.stat(sourcePath + '/' + emulatorfile, function(err, stats) {
                    
                    //bail if anything but a file
                    if (stats.isFile()) {

                        if (emulatorfile === '.DS_Store' || /\.mem$/.test(emulatorfile)) {
                            nextemulatorfile();
                            return;
                        }
                        
                        console.log(emulatorfile);

                        //read file
                        fs.readFile(sourcePath + '/' + emulatorfile, 'utf8', function(err, content) {
                            if (err) {
                                return res.json(err);
                            }

                            var re = null;

                            //replacements
                            
                            re = /memoryInitializer="(.*\.mem)"/;
                            console.log('memory file location found ---> ' + re.test(content));
                            content = content.replace(re, 'memoryInitializer="https://dl.dropboxusercontent.com/u/1433808/crazyerics/emulators/$1"');

                            re = /return document;/
                            console.log('return document found ---> ' + re.test(content));
                            content = content.replace(re, 'return Module["canvas"];');
                            re = /return window;/;
                            console.log('return window found ---> ' + re.test(content));
                            content = content.replace(re, 'return Module["canvas"];');

                            re = /(eventHandler\.handlerFunc\(event\);)/;
                            console.log('event handler found ---> ' + re.test(content));
                            content = content.replace(re, '$1event.preventDefault();');

                            // re = /document\./g;
                            // console.log('document. found ---> ' + re.test(content));
                            // content = content.replace(re, 'parent.document.');

                            // re = /document\[/g;
                            // console.log('document[ found ---> ' + re.test(content));
                            // content = content.replace(re, 'parent.document[');

                            // re = /windows\./g;
                            // console.log('window. found ---> ' + re.test(content));
                            // content = content.replace(re, 'parent.window.');

                            fs.writeFile(destinationPath + '/' + emulatorfile, content, function(err) {
                                if (err) {
                                    return nextemulatorfile(err);
                                }

                                nextemulatorfile();
                            }); 
                        });
                    }
                });

            }, function(err, result) {

                if (err) {
                    return res.json(err);
                }
                return res.json();
            });
        });
    });
});

module.exports = router;
