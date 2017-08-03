var fs = require('fs');
var async = require('async');
var config = require('config');
var UsersSQL = require('../db/users.js');
var NodeCache = require('node-cache');

const nodecache = new NodeCache({
    stdTTL: 60 * 60 * 24 * 30,      //30 days
    checkperiod: 60 * 60            //1 hour 
});

/**
 * Constructor
 */
UsersService = function() {
};

//middleware to attach user details to request (see app.js)
UsersService.GetUserFromCache = function(req, res, next) {
    
    if (req.session) {
        
        var sessionId = req.session.id;
        var cacheKey = 'sessionId.' + sessionId;
        
        //check if cache has user before db
        nodecache.get(cacheKey, (err, userCache) => {
            if (err) {
                return next(err);
            }

            if (userCache) {
                req.user = userCache;
                next();
            }
            //didn't get user cache, check the data layer now
            else {

                UsersSQL.GetUserWithSessionID(sessionId, (err, user) => {
                    if (err) {
                        return next(err);
                    }

                    //if user returned, cache it. if undef, probably because its being inserted, np
                    if (user) {
                        nodecache.set(cacheKey, user);
                        req.user = user;
                    }
                    next();
                });
            }
        });
    }
    else {
        next();
    }
};

//since this func is called from an event emit from the pg-connect-simple-crazyerics middleware, there is no callback
UsersService.OnSessionCreation = function(sessionId) {

    UsersSQL.CreateNewUser(sessionId, (err) => {
        if (err) {
            console.log('Error on create new user:', err);
        }
    });         
};

module.exports = UsersService;
