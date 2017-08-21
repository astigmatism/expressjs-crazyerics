'use strict';
const fs = require('fs');
const async = require('async');
const config = require('config');
const UsersSQL = require('../db/users');
const UtilitiesService = require('./utilities');
const CollectionService = require('./collections');

module.exports = new (function() {

    var _self = this;

    this.GetUserMiddleware = function(req, res, next) {

        if (req.session) {
            _self.GetUserWithSessionID(req.session.id, (err, user) => {
                if (err) {
                    return next(err);
                }
                req.user = user; //attach user to req for use accross server
                next();
            });
        }
        else {
            next('Session not found on request');
        }
    };

    this.GetUserWithSessionID = function(sessionId, callback) {
    
        UsersSQL.GetUserWithSessionID(sessionId, (err, user) => {
            if (err) {
                return next(err);
            }

            if (user) {
                callback(null, user);
            }
            //user not found? probably new, create one to ensure relable data from this function
            else {
                //internally calls GetUserWithSessionID to return same result after creation
                _self.CreateNewUser(sessionId, (err, user) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, user);
                });
            }
        });
    };

    this.CreateNewUser = function(sessionId, callback) {

        UsersSQL.CreateNewUser(sessionId, (err, user) => {
            if (err) {
                return callback(err);
            }
            callback(null, user);
        });         
    };

    this.OnSessionPrune = function() {
        UsersSQL.RemoveUsersWithoutSessions(err => {
            if (err) {
                console.log('Error removing users without sessions:', err);
            }
        });
    };

    /**
     * A note on user preferences.
     * This is stored in the db as stringified json. The client can consume this data as readonly
     * but they can never wholesale modify and save back to the server that structure.
     * I must maintain control on the server!
     * In that sense, expose API's for adjusting single values (see you see below)
     */

    const _activeCollectionKey = 'collections.active';

    this.GetPreferredCollection = function(sessionId, callback) {
        
        _self.GetUserWithSessionID(sessionId, (err, user) => {
            if (err) {
                return callback(err);
            }

            //get active collection from user prefs, if it doen't exist, then assign the default collection
            var activeCollection = UtilitiesService.GetNestedValue(user.preferences, _activeCollectionKey);
            if (!activeCollection) {
                
                //this can occur async
                activeCollection = config.get('defaultCollection');
                _self.SetActiveCollection(sessionId, user.user_id, activeCollection, (err, user) => {
                    //updating the user's prefs in not needed
                });
            }

            //get collection (will create if not exist)
            CollectionService.GetCollectionByName(user.user_id, activeCollection, (err, collection) => {
                if (err) {
                    return callback(err);
                }
                return callback(null, collection);
            }, true);
        });
    };

    this.SetActiveCollection = function(sessionId, userId, collection, callback) {

        _self.GetUserWithSessionID(sessionId, (err, user) => {
            if (err) {
                return callback(err);
            }
            //check preferrences
            var currentActiveCollection = UtilitiesService.GetNestedValue(user.preferences, _activeCollectionKey);

            //if no change, bail
            if (currentActiveCollection === collection) {
                return callback();
            }
            else {
                var updatedPreferences = UtilitiesService.Assign(user.preferences, _activeCollectionKey, collection);
                
                UsersSQL.UpdatePlayerPreferences(sessionId, userId, updatedPreferences, (err, user) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, user);
                });
            }
        });
    };

    this.GetCollectionNames = function(sessionId, callback) {

        _self.GetUserWithSessionID(sessionId, (err, user) => {
            if (err) {
                return callback(err);
            }
            //we cache the list of user's collections (since they may not change frequently)
            CollectionService.GetCollectionNames(user.user_id, (err, collections) => {
                if (err) {
                    return callback(err);
                }
                return callback(null, collections); //an array, empty or otherwise
            });
        });
    };

})();
