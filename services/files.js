const fs = require('fs');
const async = require('async');
const colors = require('colors');
const Cache = require('../services/cache');
const NodeCache = require('node-cache');

//define custom cache for files
const FileCache = new Cache('file.$1', new NodeCache({
        stdTTL: 0,                      //0 = unlimited. 
        checkperiod: 0                  //0 = no periodic check
    })
);

module.exports = new (function() {

    var _self = this;

    this.Get = function(path, callback, opt_forceLoad, opt_asBuffer) {

        opt_forceLoad        = opt_forceLoad || false; //ignore cache attempt and load data from source
        opt_asBuffer         = opt_asBuffer || false; //default: to parse and return as json

        FileCache.Get([path], (err, cache) => {
            if (err) {
                return callback(err);
            }
            //if successful cache hit and we're not forcing to load data from source
            if (cache && !opt_forceLoad) {
                return callback(null, cache);
            }
            
            //no successful cache hit, find in file system and add to cache
            var fullPath = __dirname + '/..' + path;
            
            fs.readFile(fullPath, 'utf8', function(err, content) {
                if (err) {
                    return callback(err);
                }

                //JSON parse file contents, comes in as string
                if (!opt_asBuffer) {
                    try {
                        content = JSON.parse(content);
                    } catch (e) {
                        return callback(e);
                    }
                }

                _self.Set(path, content, (err, success) => {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, content);
                });
            });
        });
    };

    //sometimes we want to cache data and treat it like openning a file, so expose this
    this.Set = function(path, data, opt_callback) {

        FileCache.Set([path], data, (err, success) => {
            if (opt_callback) {
                if (err) {
                    return opt_callback(err);
                }
                return opt_callback(null, success);
            }
        });
    };

    //rudimentary file system operations

    this.DeleteFile = function(path, callback) {
        fs.unlink(__dirname + '/..' + path, (err) => {
            if (err) return callback(err);
            callback();
        });
    };

    this.WriteFile = function(path, content, callback) {
        fs.writeFile(__dirname + '/..' + path, content, (err) => {
            if (err) return callback(err);
            callback();
        })
    };

    this.ReadFile = function(path, callback) {
        fs.readFile(__dirname + '/..' + path, (err, data) => {
            if (err) return callback(err);
            callback(null, data);
        });
    };

    this.ReadJsonFile = function(path, callback) {
        fs.readFile(__dirname + '/..' + path, (err, data) => {
            if (err) return callback(err);
            try {
                data = JSON.parse(data);
            }
            catch (e) {
                return callback(e);
            }
            callback(null, data);
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
