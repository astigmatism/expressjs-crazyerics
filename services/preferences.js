'use strict';
const config = require('config');
const Cache = require('../services/cache/cache.redis.js');
const UtilitiesService = require('./utilities');

/**
 * A note on user preferences.
 * Preferences are configurations made by the client to define their experience
 * and at this time, they are not important enough to store in a data solution!!! <----
 * User preferences are stored in two places: server cache and client cookie
 * therefore, the authority of the data goes between the two:
 * If the server has it cached, then it overwrites the client cookie
 * When the client sends it back, its cached again on the server
 * 
 * I wanted to make this feature abstract so that I could tie it into a document-based
 * db system in the future.. maybe?
 */
module.exports = new (function() {

    var _self = this;
    var _cache = new Cache('user.$1.preferences'); //uses default ttl of 1 hour

    this.Get = function(userId, callback, opt_key) {

        _cache.Get([userId], (err, cache) => {
            if (err) {
                return callback(err);
            }
            if (cache) {
                
                if (opt_key) {
                    var value = UtilitiesService.GetNestedValue(cache, opt_key);
                    return callback(null, value);
                }
                //if key was not set, they return all preferences
                else {
                    return callback(null, cache);
                }
            }
            else {
                callback(); //send undef if not found
            }
        });
    };

    this.Set = function(userId, key, value, callback) {

        //this will ensure that if not set, we'll get back an empty object to cache
        _self.Get(userId, (err, cache) => {
            if (err) {
                return callback(err);
            }

            //if nothing came back, initialize the preference cache
            //for preferences, we want to validate who has the authority. the client might have newer preferences stored in a cookie
            //and the server cache expired or was cleared. In this case, we tell the client this is new cache
            if (!cache) {
                cache = {
                    validated: 0
                }
            }
            
            cache = UtilitiesService.Assign(cache, key, value);
        
            _cache.Set([userId], cache, (err, success) => {
                if (err) {
                    return callback(err);
                }
                callback(null, success);
            });
        });
    };

    this.Remove = function(userId, key, callback) {

        _self.Get(userId, (err, cache) => {
            if (err) {
                return callback(err);
            }

            if (!cache) {
                cache = {
                    validated: 0
                };
            }

            RemoveNestedPreferenceValue(cache, key);

            _cache.Set([userId], cache, (err, success) => {
                if (err) {
                    return callback(err);
                }
                callback(null, success);
            });
        });
    };

    var RemoveNestedPreferenceValue = function(object, key) {
        var pieces = String(key || '').split('.');
        var currentDepth = object;
        var parents = [];
        var i;

        for (i = 0; i < pieces.length; ++i) {
            var currentKey = pieces[i];

            if (!currentDepth || !currentDepth.hasOwnProperty(currentKey)) {
                return object;
            }

            if (i == pieces.length - 1) {
                delete currentDepth[currentKey];
                break;
            }

            parents.push({
                object: currentDepth,
                key: currentKey
            });
            currentDepth = currentDepth[currentKey];
        }

        for (i = parents.length - 1; i >= 0; i--) {
            var parentValue = parents[i].object[parents[i].key];

            if (!parentValue || typeof parentValue !== 'object' || Object.keys(parentValue).length > 0) {
                break;
            }

            delete parents[i].object[parents[i].key];
        }

        return object;
    };

    this.SetAsync = function(userId, key, value) {
        _self.Set(userId, key, value, (err, success) => {
            //its async! we don't care!
        });
    };

    this.Sync = new (function() {
        
        var __self = this;
        this.ready = false;

        //client had new data to update the server
        this.Incoming = function(userId, preferences) {

            _cache.Set([userId], preferences, (err, success) => {
                //since this is called from middleware, I could potentionally report errors, but I'll just treat it as async
            });
        };

        //update the client with new data
        this.Outgoing = function(userId, callback) {

            _self.Get(userId, (err, cache) => {
                if (err) {
                    return callback(err);
                }
                __self.ready = false; //reset flag
                return callback(null, cache);
            });
        };

        return this;
    })();

})();