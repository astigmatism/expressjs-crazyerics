var express = require('express');
var router = express.Router();
var config = require('config');
var fs = require('fs');
var beautify = require('js-beautify');
var FileService = require('../services/files.js');
var async = require('async');

router.get('/ts/:system', (req, res) => {

    var system = req.params.system;

    if (!system) {
        return res.status(400).end('err 0'); //400 Bad Request
    }

    FileService.Get('/data/' + system + '_topsuggestions', (err, topSuggestions) => {
        if (err) {
            topSuggestions = {};
        }

        FileService.Get('/data/' + system + '_master', function(err, masterFile) {
            if (err) return res.status(500).json(err);

            //open the data file, open preexisting top suggestions file
            FileService.Get('/data/' + system + '_boxfronts', function(err, boxFronts) {
                if (err) return res.status(500).json(err);

                //merge some data in from the master file
                for (title in boxFronts) {
                    if (masterFile[title]) {
                        boxFronts[title].gk = masterFile[title].f[masterFile[title].b].gk;
                        boxFronts[title].score = masterFile[title].f[masterFile[title].b].rank;
                    }
                }

                const ordered = {};
                Object.keys(boxFronts).sort().forEach(function(key) {
                    ordered[key] = boxFronts[key];
                });

                res.render('topsuggestions', {
                    boxFronts: JSON.stringify(ordered),
                    system: system,
                    currentTs: JSON.stringify(topSuggestions),
                    cdn: config.paths.boxfront + '/a'
                });
            });
        });
    });
});

router.put('/ts/:system', (req, res) => {

    var system = req.params.system;
    var title = req.body.t;

    if (!system) {
        return res.status(400).end('err 0'); //400 Bad Request
    }
    if (!title) {
        return res.status(400).end('err 1'); //400 Bad Request
    }

    FileService.Get('/data/' + system + '_topsuggestions', (err, topSuggestions) => {
        if (err) {
            topSuggestions = {};
        }

        topSuggestions[title] = {};

        FileService.Set('/data/' + system + '_topsuggestions', topSuggestions, (err) => {
            if (err) return res.status(500).end(err);

            res.status(200).send();
        }, true); //true says to write the file on set
    });
});

router.delete('/ts/:system', (req, res) => {

    var system = req.params.system;
    var title = req.body.t;

    if (!system) {
        return res.status(400).end('err 0'); //400 Bad Request
    }
    if (!title) {
        return res.status(400).end('err 1'); //400 Bad Request
    }

    FileService.Get('/data/' + system + '_topsuggestions', (err, topSuggestions) => {
        if (err) {
            topSuggestions = {};
        }

        delete topSuggestions[title];

        FileService.Set('/data/' + system + '_topsuggestions', topSuggestions, (err) => {
            if (err) return res.status(500).end(err);

            res.status(200).send();
        }, true); //true says to write the file on set
    });
});

router.get('/three', function(req, res, next) {
    res.render('work');
});

router.get('/emulatorprep169', function(req, res, next) {

    var EMULATOR_VERSION = '1.6.9-stable';
    var SOURE_PATH = __dirname + '/../workspace/RetroArch-stable-1.6.9/';
    
    var writeMemFileToDestination = true;
    
    var emulatorAssetLocation = config.get('paths.emulators') + '/' + EMULATOR_VERSION + '/';
    var destinationPath = __dirname + '/../public/emulators/' + EMULATOR_VERSION;

    var output = {};
    output[EMULATOR_VERSION] = {};

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

                        //get ra for audio context
                        re = /(RA.context=new ac;)/;
                        console.log('found place to attach ra  ---> ' + re.test(content));
                        content = content.replace(re, '$1Module.RA=RA;');

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

                                output[EMULATOR_VERSION][emulatorfile] = {};
                                output[EMULATOR_VERSION][emulatorfile]["s"] = stat.size;

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

                console.log('Copy the result in the response to config');

                return res.json(output);
            });
        });
    });
});

router.get('/emulatorprep173', function(req, res, next) {

    var EMULATOR_VERSION = '1.7.3-stable';
    var SOURE_PATH = __dirname + '/../workspace/RetroArch-stable-1.7.3/';
    
    var writeMemFileToDestination = true;
    
    var emulatorAssetLocation = config.get('paths.emulators') + '/' + EMULATOR_VERSION + '/';
    var destinationPath = __dirname + '/../public/emulators/' + EMULATOR_VERSION;

    var output = {};
    output[EMULATOR_VERSION] = {};

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
                        re = /wasmBinaryFile="(.*\.wasm)"/;
                        console.log('memory file location found ---> ' + re.test(content));
                        content = content.replace(re, 'wasmBinaryFile="' + emulatorAssetLocation + '$1"');

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
                        re = /(function _emscripten_exit_pointerlock)/;
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
                        re = /(var SYSCALLS)/;
                        console.log('found place to attach fs  ---> ' + re.test(content));
                        content = content.replace(re, 'Module.FS=FS;$1');

                        //get ra for audio context
                        re = /(RA.context=new ac;)/;
                        console.log('found place to attach ra  ---> ' + re.test(content));
                        content = content.replace(re, '$1Module.RA=RA;');

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

                                output[EMULATOR_VERSION][emulatorfile] = {};
                                output[EMULATOR_VERSION][emulatorfile]["s"] = stat.size;

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

                console.log('Copy the result in the response to config');

                return res.json(output);
            });
        });
    });
});

module.exports = router;
