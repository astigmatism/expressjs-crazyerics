const fs = require('fs-extra');
const async = require('async');
const colors = require('colors');
const Cache = require('../services/cache/cache.redis.js');
const path = require('path');
const request = require('request');

//define custom cache for files
const fileCache = new Cache('file.$1'); //uses default ttl of 0 (forever)
const projectRoot = __dirname + '/..';

module.exports = new (function() {

    var _self = this;

    this.Get = function(sourcePath, callback, opt_forceLoad) {

        opt_forceLoad        = opt_forceLoad || false; //ignore cache attempt and load data from source

        fileCache.Get([sourcePath], (err, jsonCache) => {
            if (err) {
                return callback(err);
            }
            //if successful cache hit and we're not forcing to load data from source
            if (jsonCache && !opt_forceLoad) {
                return callback(null, jsonCache);
            }
            
            //no successful cache hit, find in file system and add to cache
            fileSourcePath = path.join(projectRoot, sourcePath);
            
            _self.ReadJson(fileSourcePath, function(err, json) {
                if (err) return callback(err);

                _self.Set(sourcePath, json, (err, success) => {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, json);
                });
            });
        });
    };

    //sometimes we want to cache data and treat it like openning a file, so expose this
    //optionally you can also write the file with the path definition
    this.Set = function(destinationPath, json, opt_callback, opt_writeFile) {

        fileCache.Set([destinationPath], json, (err, success) => {
            if (err && opt_callback) return opt_callback(err);

            if (opt_writeFile) {

                fileDestinationPath = path.join(projectRoot, destinationPath);

                //convert json to string for writing to file
                _self.WriteJson(fileDestinationPath, json, err => {
                    if (err && opt_callback) return opt_callback(err);

                    if (opt_callback) return opt_callback();
                });
            }
            else if (opt_callback) {
                return opt_callback();
            }
        });
    };

    this.Request = function(url, callback, opt_filePath) {
        request(url, (err, response, body) => {
            if (err) return callback(response.statusCode, err);

            body = JSON.parse(body);

            if (opt_filePath) {
                _self.Set(opt_filePath, body, null, true); //cache and write file
            }

            return callback(response.statusCode, null, body);
        });
    }

    //rudimentary file system operations

    this.WriteJson = function(path, json, callback) {
        fs.writeJson(path, json, err => {
            if (err) return callback(err);
            return callback();
        }); 
    };

    this.ReadJson = function(path, callback) {
        fs.readJson(path, (err, content) => {
            if (err) return callback(err);
            return callback(null, content);
        });
    }

    this.DeleteFile = function(path, callback) {
        fs.unlink(__dirname + '/..' + path, (err) => {
            if (err) return callback(err);
            callback();
        });
    };

    this.OpenDir = function(path, callback) {
        fs.readdir(__dirname + '/..' + path, (err, files) => {
            if (err) return callback(err);
            callback (null, files);
        });
    };

    this.createFolder = function(path, overwrite, callback) {

        fs.exists(path, function (exists) {

            var create = function() {

                fs.mkdir(path, function(err) {
                    if (err) {
                        return callback(err);
                    }

                    return callback(null)
                });
            };

            if (exists) {

                if (overwrite) {
                    _self.rmdir(path, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        create();
                    });
                } else {
                    //exists and do not overwrite
                    callback(null);
                    return;
                }
            } else {
                //does not exist
                create();
            }
        });
    };

    this.rmdir = function(path, callback) {
        fs.readdir(path, function(err, files) {
            if(err) {
                // Pass the error on to callback
                callback(err, []);
                return;
            }
            var wait = files.length,
                count = 0,
                folderDone = function(err) {
                count++;
                // If we cleaned out all the files, continue
                if( count >= wait || err) {
                    fs.rmdir(path,callback);
                }
            };
            // Empty directory to bail early
            if(!wait) {
                folderDone();
                return;
            }
            
            // Remove one or more trailing slash to keep from doubling up
            path = path.replace(/\/+$/,"");
            files.forEach(function(file) {
                var curPath = path + "/" + file;
                fs.lstat(curPath, function(err, stats) {
                    if( err ) {
                        callback(err, []);
                        return;
                    }
                    if( stats.isDirectory() ) {
                        FileService.rmdir(curPath, folderDone);
                    } else {
                        fs.unlink(curPath, folderDone);
                    }
                });
            });
        });
    };

    this.emptydir = function(path, callback) {
        fs.readdir(path, function(err, files) {
            if(err) {
                // Pass the error on to callback
                callback(err, []);
                return;
            }
            var wait = files.length,
                count = 0,
                folderDone = function(err) {
                count++;
                // If we cleaned out all the files, continue
                if( count >= wait || err) {
                    callback();
                }
            };
            // Empty directory to bail early
            if(!wait) {
                folderDone();
                return;
            }
            
            // Remove one or more trailing slash to keep from doubling up
            path = path.replace(/\/+$/,"");
            files.forEach(function(file) {
                var curPath = path + "/" + file;
                fs.lstat(curPath, function(err, stats) {
                    if( err ) {
                        callback(err, []);
                        return;
                    }
                    if( stats.isDirectory() ) {
                        FileService.rmdir(curPath, folderDone);
                    } else {
                        fs.unlink(curPath, folderDone);
                    }
                });
            });
        });
    };

})();
