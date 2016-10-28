var express = require('express');
var router = express.Router();
var config = require('config');
var fs = require('fs');
var beautify = require('js-beautify');
var DataService = require('../services/data.js');
var async = require('async');

router.get('/', function(req, res, next) {

    var emulator = req.query.emulator || 'genesis_plus_gx_libretro';

    res.render('emulatortest', {
        emuname: emulator
    });
});

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

                            //add JSEvents to Module for access in crazyerics
                            re = /(function _emscripten_set_visibilitychange_callback)/;
                            console.log('found reference to JSEvents handler ---> ' + re.test(content));
                            content = content.replace(re, 'Module.JSEvents=JSEvents;$1');

                            //adds custom event listener to JSevents and also prevents bubbling
                            re = /(eventHandler\.handlerFunc\(event\);)/;
                            console.log('event handler found to prevent events from bubbling ---> ' + re.test(content));
                            content = content.replace(re, 'JSEvents.crazyericsEventListener(event);$1event.preventDefault();');

                            //at the beginning of this function we can trap the event hanlder for keypresses
                            re = /(\}\)\,getBoundingClientRectOrZeros)/;
                            console.log('keypress event handler found ---> ' + re.test(content));
                            content = content.replace(re, ';JSEvents.crazyericsKeyEventHandler=handlerFunc;$1');

                            // re = /document\.addEventListener/g;
                            // console.log('found document.addEventListener fixes ---> ' + re.test(content));
                            // content = content.replace(re, 'parent.document.addEventListener');

                            // re = /document\./g;
                            // console.log('document. found ---> ' + re.test(content));
                            // content = content.replace(re, 'parent.document.');

                            // re = /document\[/g;
                            // console.log('document[ found ---> ' + re.test(content));
                            // content = content.replace(re, 'parent.document[');

                            // re = /windows\./g;
                            // console.log('window. found ---> ' + re.test(content));
                            // content = content.replace(re, 'parent.window.');

                            // re = /screen\./g;
                            // console.log('screen. found ---> ' + re.test(content));
                            // content = content.replace(re, 'parent.screen.');
                            
                            // re = /function _RWebInputDestroy/
                            // console.log('found place to insert handle to RI ---> ' + re.test(content));
                            // content = content.replace(re, 'Module.RI = RI;function _RWebInputDestroy');

                            re = /var curr=FS\.write\(stream.HEAP8,ptr,len,offset\);/;
                            console.log('found place to intercept emulator writing files  ---> ' + re.test(content));
                            content = content.replace(re, 'var curr=FS.write(stream,HEAP8,ptr,len,offset);if (Module.emulatorFileWritten && stream && stream.node && stream.node.name && stream.node.contents) { Module.emulatorFileWritten(stream.node.name, stream.node.contents);}');


                            //beautify for debugging (found this really didnt work too well)
                            // try {
                            //     content = beautify(content, { indent_size: 4 });
                            // } catch (e) {
                            //     console.log('Error in beautify: ', e);
                            // }

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
