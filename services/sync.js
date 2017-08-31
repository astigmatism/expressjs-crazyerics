'use strict';
const async = require('async');
const config = require('config');
const UtilitiesService = require('./utilities');
const CollectionsService = require('./collections');
const PreferenceService = require('./preferences');

module.exports = new (function() {

    var _self = this;

    this.Incoming = function(req, res, next) {

        //manage incoming from client sync component. client adds header
        if (req.body && req.headers.sync == 1) {
            
            var components;

            //decompress body, parse out component data
            try {
                var body = UtilitiesService.Decompress.json(req.body);
                
                if (body._c) {
                    components = body._c; //UtilitiesService.Decompress.json(body._c);
                    delete body._c;
                }
                req.body = body;
            }
            catch(e) {
                //nothing really, we simply dont update server if the user messed with response data
                return next(e);
            }

            if (components && req.user) {

                //preferences update from client
                if (components.p) {                

                    PreferenceService.Sync.Incoming(req.user.user_id, components.p);
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
