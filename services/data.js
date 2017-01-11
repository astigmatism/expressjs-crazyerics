var NodeCache = require('node-cache');
var fs = require('fs');
var type = require('type-of-is');
var async = require('async');

var nodecache = new NodeCache({
    stdTTL: 100,
    checkperiod: 120
});

/**
 * DataService Constructor
 */
DataService = function() {
};

/**
 * Loads a file's contents given a path, will load from cache if already loaded
 * @param  {string}   path
 * @param  {Function} callback
 * @param  {boolean}  forceLoad    		when true, ignores cache and loads from source
 * @param  {number}   cacheLifetime 	when cached, optionally define how long, default is forever
 * @return {Function}
 */
DataService.getFile = function(path, callback, forceLoad, cacheLifetime, buffer) {

    var self = this;

    cacheLifetime    = cacheLifetime || 0; //how long should this file's content persist in cache? 0 = forever, -1 = don't put in cache at all
    forceLoad        = forceLoad || false; //ignore cache attempt and load data from source
    buffer           = buffer || false; //false attempts to format file contents as JSON.

    //attempt to retireve file contents. cachekey is file path
    self.getCache(path, function(err, data) {
        if (err) {
            return callback(err);
        }

        //if successful cache hit and we're not forcing to load data from source
        if (data && !forceLoad) {
            return callback(null, data);
        }

        var fullPath = __dirname + '/..' + path;

        //no successful cache hit, find in file system and add to cache
        fs.readFile(fullPath, 'utf8', function(err, content) {
            if (err) {
                return callback(err);
            }

            //JSON parse file contents, comes in as string
            if (!buffer) {
                try {
                    content = JSON.parse(content);
                } catch (e) {
                    return callback(e);
                }
            }

            self.setCache(path, content, cacheLifetime, function() {
                return callback(null, content);
            });
        });
    });
};

//writes each object property/value to cache
DataService.wholescaleSetCache = function(object, cacheLifetime, callback) {

    var self        = this;
    cacheLifetime   = cacheLifetime || 0; //how long should this file's content persist in cache? 0 = forever, -1 = don't put in cache at all

    async.forEach(Object.keys(object), function (item, nextcache){ 
        
        self.setCache(item, object[item], cacheLifetime, function(err, data) {
            nextcache();
        });

    }, function(err) {
        if (err) {
            return callback(err);
        }
        callback();
    });

};

DataService.getCache = function(key, callback) {

    //console.log('cache request: ' + key);

    nodecache.get(key, function(err, data) {
        if (err) {
            console.log('cache error: ' + key);
            return callback(err);
        }

        if (data) {
            console.log('cache hit: ' + key);
        } else {
            console.log('cache miss: ' + key);
        }

        callback(null, data);
    });
};

DataService.setCache = function(key, data, cacheLifetime, callback) {
    
    cacheLifetime    = cacheLifetime || 0; //how long should this file's content persist in cache? 0 = forever, -1 = don't put in cache at all

    nodecache.set(key, data, cacheLifetime, function() {
        console.log('cache set: ' + key);        
        if (callback) {
            return callback(null, data);
        }
        return;
    });
};

DataService.createFolder = function(path, overwrite, callback) {

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
                DataService.rmdir(path, function (err) {
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

DataService.rmdir = function(path, callback) {
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
                    DataService.rmdir(curPath, folderDone);
                } else {
                    fs.unlink(curPath, folderDone);
                }
            });
        });
    });
};

DataService.emptydir = function(path, callback) {
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
                    DataService.rmdir(curPath, folderDone);
                } else {
                    fs.unlink(curPath, folderDone);
                }
            });
        });
    });
};

module.exports = DataService;
