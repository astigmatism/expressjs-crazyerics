'use strict';
const util = require('util');
const config = require('config');
const Redis = require('redis');
const CacheBase = require('./cache.base');

const defaultOptions = {
    stdTTL: 60 * 60,             //1 hour
};

module.exports = function(key, opt_options) {

    var _self = this;
    
    var options = opt_options || defaultOptions;
    var _client = Redis.createClient();
    var _base = new CacheBase(this, key);

    this.Get = _base.Get;
    this.Set = _base.Set;
    this.Delete = _base.Delete;

    this.name = 'redis';

    _client.on('error', function (err) {
        console.log('Redis cache failure:', err);
    });

    //https://github.com/NodeRedis/node_redis

    this.get = function(key, callback) {
        _client.get(key, (err, cache) => {
            cache = JSON.parse(cache);
            callback(err, cache);
        });
    };

    this.set = function(key, value, callback) {
        value = JSON.stringify(value);

        if (options && options.stdTTL && options.stdTTL !== 0) {
            _client.setex(key, options.stdTTL, value, (err) => {
                return callback(err, true);
            });
        }
        else {
            //no expiration
            _client.set(key, value, (err) => {
                return callback(err, true);
            });
        }
    };

    this.delete = function(key, callback) {
        _client.del(key, callback);
    };
};
