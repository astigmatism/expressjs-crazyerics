'use strict';
const fs = require('fs');
const async = require('async');
const config = require('config');
const UsersSQL = require('../db/users.js');

module.exports = new (function() {

    this.GetUserFromCache = function(req, res, next) {
    
        if (req.session) {
            
            var sessionId = req.session.id;
            
            //cached at data layer
            UsersSQL.GetUserWithSessionID(sessionId, (err, user) => {
                if (err) {
                    return next(err);
                }

                if (user) {
                    
                    //format values from db
                    try {
                        user.preferences = JSON.parse(user.preferences);
                    }
                    catch (e) {

                    }
                    
                    req.user = user;
                }
                next();
                
            });
        }
        else {
            next();
        }
    };

    this.UpdatePlayerPreferences = function(sessionId, userId, data, callback) {

        UsersSQL.UpdatePlayerPreferences(sessionId, userId, data, (err, updateResult) => {
            if (err) {
                return callback(err);
            }
            callback(null, updateResult);
        });
    };

    this.OnSessionCreation = function(sessionId) {

        UsersSQL.CreateNewUser(sessionId, (err) => {
            if (err) {
                console.log('Error on create new user:', err);
            }
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
