'use strict';
const async = require('async');
const config = require('config');
const UtilitiesService = require('./utilities');
const CollectionsService = require('./collections');
const PreferenceService = require('./preferences');

module.exports = new (function() {

    var _self = this;

    this.Incoming = function(req, res, next) {

        if (req.body && req.user) {

            //preferences update from client
            if (req.body.p) {
                var clientCache;
                try {
                    clientCache = UtilitiesService.Decompress.json(req.body.p);
                }
                catch(e) {
                    //nothing really, we simply dont update server if the user messed with client cache
                }
                if (clientCache) {
                    PreferenceService.Sync.Incoming(req.user.user_id, clientCache);
                }
            }

        }

        next();
    };

    this.Outgoing = function(response) {

        //collections update for client
        
    };

})();
