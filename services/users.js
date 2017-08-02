var fs = require('fs');
var async = require('async');
var config = require('config');
var UtilitiesService = require('./utilities.js');
var NodeCache = require('node-cache');

/**
 * Constructor
 */
UsersService = function() {
};

//middleware to attach user details to request
UsersService.CacheUserDetails = function(req, res, next) {

    if (req.session) {
        console.log('Cache User middleware! sessionId: ' + req.session.id);
    }
    else {
        console.log('session not on request object');
    }

    next();
};

//when a session is created, a user is created
UsersService.OnSessionCreation = function(sessionId) {

    console.log('UsersService.OnSessionCreation');
    // var userInstance = new UsersModel({
    //     sessions: {
    //         id: sessionId
    //     }
    // });

    // userInstance.save((err, result) => {
    //     if (err) {
    //         return console.log('Error in UsersService.OnSessionCreation', err);
    //     }
    // });
};

//from the event listener on mongo-store "update"
UsersService.OnSessionUpdate = function(sessionId) {

    console.log('UsersService.OnSessionUpdate');
    // UsersModel.findOne({ 'sessions.id': sessionId })
    // .update({ 'sessions.$.lastActivity': Date.now() })
    // .exec((err, result) => {
    //     if (err) {
    //         return console.log('Error in UsersService.OnSessionUpdate', err);
    //     }
    // });
};

UsersService.GetBySessionID = function(sessionId, callback) {

    // UsersModel.findOne({ 'sessions.id': sessionId })
    // .exec((err, result) => {
    //     if (err) {
    //         return callback(err);
    //     }
    //     return callback(null, result);
    // });
};


module.exports = UsersService;
