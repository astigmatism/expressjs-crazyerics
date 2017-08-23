'use strict';
const fs = require('fs');
const async = require('async');
const config = require('config');
const UsersSQL = require('../db/users');
const UtilitiesService = require('./utilities');

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

})();
