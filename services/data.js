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
DataService.getFile = function(path, callback, forceLoad, cacheLifetime) {

    cacheLifetime    = cacheLifetime || 0; //how long should this file's content persist in cache? 0 = forever, -1 = don't put in cache at all
    forceLoad        = forceLoad || false; //ignore cache attempt and load data from source

    //attempt to retireve file contents. cachekey is file path
    nodecache.get(path, function(err, data) {

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
            try {
                content = JSON.parse(content);
            } catch (e) {
                return callback(e);
            }

            nodecache.set(path, content, cacheLifetime, function() {
                return callback(null, content);
            });
        });
    });
};

/**
 * Get's data stored in cache given a key or keys
 * @param  {Array|string}   keys
 * @param  {Function} callback
 * @return {Function}
 */
DataService.getCache = function(keys, callback) {

    if (!type.is(keys, Array)) {
        keys = [keys];
    }

    nodecache.get(keys, function(err, results) {
        if (err) {
            console.error(err);
            return callback({}); //on error, return empty set instead of error
        }
        if (keys.length > 1) {
            return callback(results);
        }
        return callback(results[keys[0]]); //if lookup performed on one key, return result without key
    });
};

/**
 * Sets content in cache given a key and content
 * @param {Object|Array|Object}   manifest          The manifest needs to be an object with key and content properties (or an array these objects)
 * @param {Function} callback
 * @param {number}   cacheLifetime  default value is 0 = lives in cache forever
 */
DataService.setCache = function(manifest, callback, cacheLifetime) {

    cacheLifetime = cacheLifetime || 0;

    if (!type.is(manifest, Array)) {
        manifest = [manifest];
    }

    async.eachSeries(manifest, function(item, next) {

        if (cacheLifetime === -1) {
            next();
        } else {

            nodecache.set(item.key, item.content, cacheLifetime, function(err) {
                if (err) {
                    console.error(err); //in the case we cannot save cache, alert the console only
                }
                next();
            });
        }
    },
    // Final callback after each item has been iterated over.
    function() {
        if (callback) {
            callback();
        }
        return;
    });
};

module.exports = DataService;
