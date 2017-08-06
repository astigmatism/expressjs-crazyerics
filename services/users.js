var fs = require('fs');
var async = require('async');
var config = require('config');
var UsersSQL = require('../db/users.js');

/**
 * Constructor
 */
UsersService = function() {
};

//middleware to attach user details to request (see app.js)
UsersService.GetUserFromCache = function(req, res, next) {
    
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

UsersService.UpdatePlayerPreferences = function(sessionId, userId, data, callback) {

    UsersSQL.UpdatePlayerPreferences(sessionId, userId, data, (err, updateResult) => {
        if (err) {
            return callback(err);
        }
        callback(null, updateResult);
    });
};

//called from connect-pg-simple-crazyerics ---->

UsersService.OnSessionCreation = function(sessionId) {

    UsersSQL.CreateNewUser(sessionId, (err) => {
        if (err) {
            console.log('Error on create new user:', err);
        }
    });         
};

UsersService.OnSessionPrune = function() {
    UsersSQL.RemoveUsersWithoutSessions(err => {
        if (err) {
            console.log('Error removing users without sessions:', err);
        }
    });
};

// called from connect-pg-simple-crazyerics <----

module.exports = UsersService;
