'use strict';
const config = require('config');
const NodeCache = require('node-cache');
const colors = require('colors');

//standard cache if no custom was defined.
//this definition is strongly designed around users and their estimated session length (1 hour max?)
const nodecache = new NodeCache({
    stdTTL: 60 * 60,             //1 hour
    checkperiod: 60 * 7          //7 minutes
});

module.exports = function(key, opt_customCache) {

    var _self = this;
    var _cache = opt_customCache || nodecache;
    var _key = key; //expecting key template with array replacements ex: users.$1.collections
    
    var Envelope = (function(cache) {
        this.cache = cache;
        this.hits = 0;
    });

    //node-cache listeners
    _cache.on('del', function(key, envelope) {
        console.log(colors.red('cache: exp <> ' + key + ', hits: ' + envelope.hits));
    });

    this.Get = function(args, callback) {
        var key = MakeKey(args);
        var startTime = new Date().getTime();
        _cache.get(key, (err, envelope) => {
            if (err) {
                return callback(err);
            }
            if (envelope) {
                
                //for debugging - delete will show number of hits
                envelope.hits++;
                var finishTime = (new Date().getTime()) - startTime;

                console.log(('cache: get -> ' + key + ', hits: ' + envelope.hits + ', fetch time (ms): ' + finishTime).green);

                //set again but using envelope
                _self.Set(args, null, (err, success)=> {

                    return callback(null, envelope.cache);
                }, envelope);
            }
            else {
                return callback();
            }
        });
    };

    this.Set = function(args, value, opt_callback, opt_envelope) {
        var key = MakeKey(args);

        var cache = new Envelope(value);
        if (opt_envelope) {
            cache = opt_envelope;
        }   

        _cache.set(key, cache, (err, success) => {
            if (opt_callback) {
                if (err) {
                    return opt_callback(err);
                }
                opt_callback(null, success);
            }
            
            //because a set with envelope is really and "update", don't bother showing it
            if (!opt_envelope) {
                console.log(colors.blue('cache: set <- ' + key));
            }
        });
    };

    this.Delete = function(args, callback) {
        var key = MakeKey(args);

        _self.Get(args, (err, envelope) => {
            if (err) {
                return callback(err);
            }
            if (!envelope) {
                return callback();
            }

            console.log(colors.red('cache: del <> ' + key + ', hits: ' + envelope.hits));

            _cache.del(key, (err, success) => {
                if (callback) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, success);
                }
            });
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