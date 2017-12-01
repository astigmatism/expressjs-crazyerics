'use strict';
const async = require('async');
const config = require('config');
const FeaturedSQL = require('../db/featured');
const UtilitiesService = require('../services/utilities');
const FilesService = require('../services/files');
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
        FilesService.WriteFile(_path + name, JSON.stringify(gks), (err) => {
            if (err) return callback(err);
            callback();
        });
    };

    this.CreateMostPlayed = function(system, min, max, callback) {

        FeaturedSQL.GetMostPlayed(system, max, (err, results) => {
            if (err) return callback(err);

            var gameKeys = [];

            if (results.length > 0) {

                var name = results[0].system_name + ' Most Played';

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

})();
