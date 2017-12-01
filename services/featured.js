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

    this.SelectRandom = function(quantity, callback) {

        quantity = quantity || 1;
        var selection = [];
        var result = {};

        FeaturedCache.Get([], (err, cache) => {
            if (err) return callback(err);

            var keys = UtilitiesService.Shuffle(Object.keys(cache));

            //while less than asking and less than the number of keys
            for (var i = keys.length - 1; i > -1 && i > (keys.length - 1) - quantity; --i) {
                selection.push(keys[i]);
            }

            for (var i = 0, len = selection.length; i < len; ++i) {
                result[selection[i]] = cache[selection[i]];
            }
            callback(null, result);
        });
    };

    this.Select = function(name, callback) {

        FeaturedCache.Get([], (err, cache) => {
            if (err) return callback(err);

            if (cache.hasOwnProperty(name)) {
                return callback(null, cache[name]);
            }
            callback();
        })
    };

    var Add = function(name, data, callback) {

        FeaturedCache.Get([], (err, cache) => {
            if (err) return callback(err);

            if (!cache) {
                cache = {};
            }

            cache[name] = data;

            FeaturedCache.Set([], cache, (err) => {
                if (err) return callback(err);
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

            _self.SelectRandom(3, (err, selections) => {
                if (err) return callback(err);

                callback(null, selections);
            });
        };

        return this;
    })();

})();
