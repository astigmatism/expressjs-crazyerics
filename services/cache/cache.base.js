'use strict';
const config = require('config');
const colors = require('colors');

module.exports = function(cacheController, key) {

    var _self = this;
    var _key = key;
    
    var Envelope = (function(cache) {
        this.cache = cache;
        this.hits = 0;
    });

    this.Get = function(args, callback) {
        var key = MakeKey(args);
        var startTime = new Date().getTime();
        
        cacheController.get(key, (err, envelope) => {
            if (err) {
                return callback(err);
            }
            if (envelope) {
                
                //for debugging - delete will show number of hits
                envelope.hits++;
                var finishTime = (new Date().getTime()) - startTime;

                console.log((cacheController.name + ': get -> ' + key + ', hits: ' + envelope.hits + ', fetch time (ms): ' + finishTime).green);

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

        cacheController.set(key, cache, (err, success) => {
            if (opt_callback) {
                if (err) {
                    return opt_callback(err);
                }
                opt_callback(null, success);
            }
            
            //because a set with envelope is really and "update", don't bother showing it
            if (!opt_envelope) {
                console.log(colors.blue(cacheController.name + ': set <- ' + key));
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

            console.log(colors.red(cacheController.name + ': del <> ' + key + ', hits: ' + envelope.hits));

            cacheController.delete(key, (err, success) => {
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
