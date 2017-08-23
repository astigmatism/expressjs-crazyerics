'use strict';
const config = require('config');
const NodeCache = require('node-cache');
const colors = require('colors');

//standard cache if no custom was defined.
//this definition is strongly designed around users, a ttl is 30 days, the same as session
const nodecache = new NodeCache({
    stdTTL: 60 * 60 * 24 * 30,      //30 days
    checkperiod: 60 * 60            //1 hour 
});

module.exports = function(key, opt_customCache) {

    var _self = this;
    var _cache = opt_customCache || nodecache;
    var _key = key; //expecting key template with array replacements ex: users.$1.collections
    
    var Envelope = (function(cache) {
        this.cache = cache;
        this.hits = 0;
    });

    this.Get = function(args, callback) {
        var key = MakeKey(args);
        _cache.get(key, (err, envelope) => {
            if (err) {
                return callback(err);
            }
            if (envelope) {
                console.log(colors.green('cache: found -> ' + key));

                //for debugging - delete will show number of hits
                envelope.hits++;
                _self.Set(args, envelope);

                return callback(null, envelope.cache);
            }
            return callback();
        });
    };

    this.Set = function(args, value, callback) {
        var key = MakeKey(args);

        var cache = new Envelope(value);

        _cache.set(key, cache, (err, success) => {
            if (callback) {
                if (err) {
                    return callback(err);
                }
                callback(null, success);
            }
            console.log(colors.blue('cache: set   <- ' + key));
        });
    };

    this.Delete = function(args, callback) {
        var key = MakeKey(args);

        _self.Get(args, (err, envelope) => {
            if (err) {
                return callback(err);
            }
            //if it existed, then we can delete it
            if (envelope) {

                console.log(colors.red('cache: del   <- ' + key + ', hits: ' + envelope.hits));

                _cache.del(key, (err, success) => {
                    if (callback) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, success);
                    }
                });
            }
        });
    };

    var MakeKey = function(args) {
        var key = _key;
        for (var i = 0, len = args.length; i < len; ++i) {
            key = key.replace('$' + (i + 1), args[i]);
        }
        return key;
    }

};