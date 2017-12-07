'use strict';
const async = require('async');
const config = require('config');
const FeaturedSQL = require('../db/featured');
const UtilitiesService = require('../services/utilities');
const FileService = require('../services/files');
const CronService = require('../services/cron');
const Cache = require('../services/cache');
const NodeCache = require('node-cache');

const FeaturedCache = new Cache('featured', new NodeCache({
        stdTTL: 0,                      //0 = unlimited. 
        checkperiod: 0                  //0 = no periodic check
    })
);
const KeysCache = new Cache('featuredKeys', new NodeCache({
        stdTTL: 0,                      //0 = unlimited. 
        checkperiod: 0                  //0 = no periodic check
    })
);

module.exports = new (function() {

    const _self = this;
    const _path = '/data/featured/';

    this.Create = function(name, gks, callback) {

        //will replace will already exists
        FileService.WriteFile(_path + name, JSON.stringify(gks), (err) => {
            if (err) return callback(err);
            callback();
        });
    };

    this.CreateMostPlayed = function(system, min, max, callback) {

        FeaturedSQL.GetMostPlayed(system, max, (err, results) => {
            if (err) return callback(err);

            var gameKeys = [];

            if (results.length > min) {

                var name = 'Most Played ' + results[0].system_name + ' Games';

                for (var i = 0, len = results.length; i < len; ++i) {
                    
                    var gameKey = UtilitiesService.Compress.gamekey(system, results[i].title, results[i].file);
                    gameKeys.push(gameKey);
                }

                Add(name, gameKeys, (err) => {
                    if (err) return callback(err);
                    callback();
                });
            }
            else {
                callback();
            }
        });
    };

    //reload the featured title sets from the file system, replaces live cache
    //runs on app start, optional later
    this.RefreshFromFiles = function(callback) {

        FileService.OpenDir(_path, (err, files) => {
            if (err) return callback(err);

            //loop over all files
            async.each(files, function(file, nextfile) {

                //read file
                FileService.ReadJsonFile(_path + file, (err, content) => {
                    if (err) return callback(err);

                    //add to cache
                    Add(file, content, (err) => {
                        if (err) return callback(err);
                        nextfile();
                    });
                });

            }, function(err) {
                if (err) return callback(err);

                callback();
            });
        });
    };

    this.GetRandom = function(opt_quantity, callback) {
        
        opt_quantity = opt_quantity || 1;

        KeysCache.Get([], (err, keys) => {
            if (err) return callback(err);
            
            var random = Math.floor(Math.random() * keys.length);
            _self.GetNext(random, opt_quantity, callback);
        });
    };

    this.GetNext = function(opt_index, opt_quantity, callback) {

        opt_index = opt_index || 0;
        opt_quantity = opt_quantity || 1;
        var result = [];

        KeysCache.Get([], (err, keys) => {
            if (err) return callback(err);

            FeaturedCache.Get([], (err, cache) => {
                if (err) return callback(err);

                for (var i = 0; i < opt_quantity; ++i) {

                    //take from correct place in keys since i can be out of bounds
                    var index = ((i + opt_index) % keys.length);
                    var key = keys[index];

                    result.push({
                        name: key,
                        index: index,
                        gks: cache[key]
                    });

                }

                callback(null, result);
            });
        });
    };

    var Add = function(name, data, callback) {

        //add set to cache
        FeaturedCache.Get([], (err, cache) => {
            if (err) return callback(err);

            if (!cache) {
                cache = {};
            }

            cache[name] = data;

            FeaturedCache.Set([], cache, (err) => {
                if (err) return callback(err);

                //everytime we add a new key, let's randomize all keys
                var keys = UtilitiesService.Shuffle(Object.keys(cache));
                KeysCache.Set([], keys);

                callback();
            });
        });
    };

    this.Sync = new (function() {
        
        var __self = this;
        this.ready = false;

        //we don't respond to incoming data about featured from the client through Sync
        this.Incoming = function() {
            return;
        };

        //outgoing is how we package the data here on the serverside to the client
        this.Outgoing = function(callback) {

            _self.GetRandom(null, (err, selection) => {
                if (err) return callback(err);

                callback(null, selection);
            });
        };

        return this;
    })();

})();
