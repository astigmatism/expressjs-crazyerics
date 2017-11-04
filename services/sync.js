'use strict';
const async = require('async');
const config = require('config');
const UtilitiesService = require('./utilities');
const CollectionsService = require('./collections');
const SavesService = require('./saves');
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

    //outgoing is called from various routes which will return response data to the client along with any
    //component data that sync determines needs to be updated on the client.
    //the incoming parameters provide context between the server and client, like current user and current game
    this.Outgoing = function(response, userId, eGameKey, callback) {

        response = response || {};
        response._c = response._c || {}; //_c will hold all data for components on client

        //collections update for client
        CheckCollections(userId, (err, data) => {
            if (err) {
                return callback(err);
            }
            if (data) {
                response._c.c = data; //c for collections
            }

            //saves update for client
            CheckSaves(userId, eGameKey, (err, data) => {
                if (err) {
                    return callback(err);
                }
                if (data) {
                    response._c.s = data; //s for saves
                }

                var compressed = UtilitiesService.Compress.json(response); //compress entire response for sync on client side

                callback(null, compressed);
            });
        });
    };

    var CheckCollections = function(userId, callback) {
        
        //if ready flag not set, no new information for client
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

    var CheckSaves = function(userId, gameKey, callback) {

        //if ready flag not set, no new information for client
        if (!SavesService.Sync.ready) {
            return callback();
        }

        SavesService.Sync.Outgoing(userId, gameKey, (err, data) => {
            if (err) {
                return callback(err);
            }
            return callback(null, data);
        });
    };

})();
