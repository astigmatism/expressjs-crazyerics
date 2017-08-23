'use strict';
const config = require('config');
const NodeCache = require('node-cache');
const Cache = require('./cache');
const UtilitiesService = require('./utilities');

/**
 * A note on user preferences.
 * Preferences are configurations made by the client to define their experience
 * and at this time, they are not important enough to store in a data solution
 * User preferences are stored in two places: server cache and client cookie
 * therefore, the authority of the data goes between the two:
 * If the server has it cached, then it overwrites the client cookie
 * When the client sends it back, its cached again
 */
module.exports = new (function() {

    var _self = this;
    var _cache = new Cache('user.$1.preferences');

    this.GetPreferencesMiddleware = function(req, res, next) {

        if (req.user) {
            _self.Get(req.user.user_id, (err, cache) => {
                if (err) {
                    return next(err);
                }
                req.preferences = cache; //attach to request object for anything that needs it
                next();
            });
        }
        else {
            next('User not found on request');
        }
    };

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
            callback(null, {}); //an empty object when none found
        });
    };

    this.Set = function(userId, key, value, callback) {

        //this will ensure that if not set, we'll get back an empty object to cache
        self.Get(userId, (err, cache) => {
            if (err) {
                return callback(err);
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

    this.SetAsync = function(userId, key, value) {
        self.Set(userId, key, value, (err, success) => {
            //its async! we don't care!
        });
    };

})();