var express = require('express');
var router = express.Router();
var config = require('config');
var fs = require('fs');
var beautify = require('js-beautify');
var FileService = require('../services/fileservice.js');
var async = require('async');

router.get('/', function(req, res, next) {

    var emulator = req.query.emulator || 'genesis_plus_gx_libretro';

    res.render('emulatortest', {
        emuname: emulator
    });
});

router.get('/emulatorprep', function(req, res, next) {

    var EMULATOR_VERSION = '2017-03-27';
    var SOURE_PATH = __dirname + '/../workspace/2017-03-27_RetroArch/';
    
    var writeMemFileToDestination = true;
    
    var emulatorAssetLocation = 'https://dl.dropboxusercontent.com/u/1433808/crazyerics/emulators/' + EMULATOR_VERSION + '/'; //'/emulators/' + EMULATOR_VERSION + '/';
    var destinationPath = __dirname + '/../public/emulators/' + EMULATOR_VERSION;

    var manifest = {};

    //open source folder
    fs.readdir(SOURE_PATH, function(err, emulatorfiles) {
        if (err) {
            return res.json(err);
        }

        //passing true to second param says to overwrite on exist
        FileService.createFolder(destinationPath, true, function(err) {
            if (err) {
                return res.json(err);
            }

            //loop over all file contents
            async.eachSeries(emulatorfiles, function(emulatorfile, nextemulatorfile) {

                console.log('\n\nFile: ' + emulatorfile);

                fs.stat(SOURE_PATH + '/' + emulatorfile, function(err, stats) {
                    
                    //bail if anything but a file
                    if (!stats.isFile()) {
                        nextemulatorfile();
                        return;
                    }   

                    if (/\.mem$/.test(emulatorfile) && writeMemFileToDestination) {
                        fs.createReadStream(SOURE_PATH + '/' + emulatorfile).pipe(fs.createWriteStream(destinationPath + '/' + emulatorfile));
                        nextemulatorfile();
                        return;
                    }

                    if (!/\.js$/.test(emulatorfile)) {
                        nextemulatorfile();
                        return;
                    }

                    //read file
                    fs.readFile(SOURE_PATH + '/' + emulatorfile, 'utf8', function(err, content) {
                        if (err) {
                            return res.json(err);
                        }

                        var re = null;


                        //make the entire thing a closure
                        content = 'var cesRetroArchEmulator = (function(Module) { ' + content + ' });';

                        //replacements
                        
                        //remove the unneeded Module declaration since I am passing it into the closure
                        re = /var Module;/;
                        console.log('uneeded Module definition found ---> ' + re.test(content));
                        content = content.replace(re, '');

                        //set the memory file location
                        re = /memoryInitializer="(.*\.mem)"/;
                        console.log('memory file location found ---> ' + re.test(content));
                        content = content.replace(re, 'memoryInitializer="' + emulatorAssetLocation + '$1"');

                        //getting window and document returns canvas
                        // re = /return document;/
                        // console.log('return document found ---> ' + re.test(content));
                        // content = content.replace(re, 'return Module["canvas"];');
                        // re = /return window;/;
                        // console.log('return window found ---> ' + re.test(content));
                        // content = content.replace(re, 'return Module["canvas"];');

                        //add function to JS events
                        // re = /(JSEvents=\{)/;
                        // console.log('found reference to JSEvents ---> ' + re.test(content));
                        // content = content.replace(re, '$1crazyericsEventListener:function(){},');

                        //add JSEvents to Module for external access
                        re = /(function _emscripten_set_visibilitychange_callback)/;
                        console.log('found reference to JSEvents handler ---> ' + re.test(content));
                        content = content.replace(re, 'Module.JSEvents=JSEvents;$1');

                        //this insertion allows event handlers to be monitored in ces
                        re = /(var jsEventHandler=)/;
                        console.log('add handler for window callback location ---> ' + re.test(content));
                        content = content.replace(re, 'eventHandler=Module.cesEventHandlerRegistered(eventHandler);if(!eventHandler)return;$1');

                        //adds custom event listener to JSevents and also prevents bubbling
                        // re = /(eventHandler\.handlerFunc\(event\);)/;
                        // console.log('event handler found to prevent events from bubbling ---> ' + re.test(content));
                        // content = content.replace(re, 'JSEvents.crazyericsEventListener(event);$1event.preventDefault();');

                        // re = /document(.addEventListener\("keyup",RI.eventHandler,false\);)document(.addEventListener\("keydown",RI.eventHandler,false\);)/;
                        // console.log('found document.addEventListener fixes ---> ' + re.test(content));
                        // content = content.replace(re, 'document.getElementById("emulatorwrapper")$1document.getElementById("emulatorwrapper")$2');

                        // re = /document(.removeEventListener\("keyup",RI.eventHandler,false\);)document(.removeEventListener\("keydown",RI.eventHandler,false\);)/;
                        // console.log('found document.removeEventListener fixes ---> ' + re.test(content));
                        // content = content.replace(re, 'document.getElementById("emulatorwrapper")$1document.getElementById("emulatorwrapper")$2');

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
                        
                        //attach RI to Module for input event control
                        // re = /function _RWebInputDestroy/
                        // console.log('found place to insert handle to RI ---> ' + re.test(content));
                        // content = content.replace(re, 'Module.RI = RI;function _RWebInputDestroy');

                        //module.fs, just in case we want it
                        re = /(Module\["FS_createFolder"\]=FS.createFolder;)/;
                        console.log('found place to attach fs  ---> ' + re.test(content));
                        content = content.replace(re, 'Module.FS=FS;$1');

                        //trap file writes
                        re = /(return ret\}\),varargs)/;
                        console.log('found place to intercept emulator writing files  ---> ' + re.test(content));
                        content = content.replace(re, 'if (Module.cesEmulatorFileWritten && stream && stream.node && stream.node.name && stream.node.contents) { Module.cesEmulatorFileWritten(stream.node.name, stream.node.contents);}$1');

                        //trap file reads
                        re = /(return ret\}\),doWritev)/;
                        console.log('found place to intercept emulator reading files  ---> ' + re.test(content));
                        content = content.replace(re, 'if (Module.cesEmulatorFileRead && stream && stream.node && stream.node.name && stream.node.contents) { Module.cesEmulatorFileRead(stream.node.name, stream.node.contents, iov, iovcnt, offset);}$1');

                        //trap file writes
                        // re = /var curr=FS\.write\(stream,HEAP8,ptr,len,offset\);/;
                        // console.log('found place to intercept emulator writing files  ---> ' + re.test(content));
                        // content = content.replace(re, 'var curr=FS.write(stream,HEAP8,ptr,len,offset);if (Module.cesEmulatorFileWritten && stream && stream.node && stream.node.name && stream.node.contents) { Module.cesEmulatorFileWritten(stream.node.name, stream.node.contents, len, ptr, offset);}');

                        //trap file reads
                        // re = /(var curr = FS\.read\(stream,HEAP8,ptr,len,offset\));/;
                        // console.log('found place to intercept emulator reading files  ---> ' + re.test(content));
                        // content = content.replace(re, '$1if (Module.cesEmulatorFileRead && stream && stream.node && stream.node.name && stream.node.contents) { Module.cesEmulatorFileRead(stream.node.name, stream.node.contents, len, ptr, offset);}');

                        //beautify for debugging (found this really didnt work too well)
                        // try {
                        //     content = beautify(content, { indent_size: 4 });
                        // } catch (e) {
                        //     console.log('Error in beautify: ', e);
                        // }

                        fs.writeFile(destinationPath + '/' + emulatorfile, content, function(err) {
                            if (err) {
                                console.log(err);
                                return nextemulatorfile(err);
                            }

                            //get resulting filesize
                            fs.stat(destinationPath + '/' + emulatorfile, (err, stat) => {

                                manifest[emulatorfile] = {};
                                manifest[emulatorfile].s = stat.size;

                                console.log('file size: ' + stats.size);

                                nextemulatorfile();
                            });
                        }); 
                    });
                });

            }, function(err, result) {

                if (err) {
                    return res.json(err);
                }

                console.log('copy this into config:');
                console.log(manifest);

                return res.json();
            });
        });
    });
});

module.exports = router;
