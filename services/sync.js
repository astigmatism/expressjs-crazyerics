'use strict';
const async = require('async');
const config = require('config');
const UtilitiesService = require('./utilities');
const CollectionsService = require('./collections');
const PreferenceService = require('./preferences');

module.exports = new (function() {

    var _self = this;

    this.Incoming = function(req, res, next) {

        //if _c in body (component data) then service has update from client
        if (req.body && req.body._c && req.user) {

            var clientCache;
            try {
                clientCache = UtilitiesService.Decompress.json(req.body._c);
            }
            catch(e) {
                //nothing really, we simply dont update server if the user messed with client cache
            }

            if (clientCache) {

                //preferences update from client
                if (clientCache.p) {                

                    PreferenceService.Sync.Incoming(req.user.user_id, clientCache.p);
                }
            }
        }

        next();
    };

    this.Outgoing = function(response, userId, callback) {

        response = response || {};
        response._c = response._c || {};

        //collections update for client
        CheckCollections(userId, (err, data) => {
            if (err) {
                return callback(err);
            }
            if (data) {
                response._c.c = data;
            }

            var compressed = UtilitiesService.Compress.json(response);

            callback(null, compressed);
        });
        
    };

    var CheckCollections = function(userId, callback) {
        
        if (!CollectionsService.Sync.ready) {
            return callback();
        }

        CollectionsService.Sync.Outgoing(userId, (err, data) => {
            if (err) {
                return callback(err);
            }
            return callback(null, data);
        });
    };



})();
