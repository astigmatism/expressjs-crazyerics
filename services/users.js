var fs = require('fs');
var async = require('async');
var config = require('config');
var UsersModel = require('../models/users');
var UserSessionsModel = require('../models/usersessions');
var UtilitiesService = require('./utilities.js');

/**
 * Constructor
 */
UsersService = function() {
};

//when a session is created, a user is created
UsersService.OnSessionCreation = function(sessionId) {

    var userInstance = new UsersModel({});

    userInstance.save((err, result) => {
        if (err) {
            return console.log('Error in UsersService.OnSessionCreation', err);
        }

        var userSessionInstance = new UserSessionsModel({
            userId: result._doc._id,
            sessionId: sessionId
        });

        userSessionInstance.save((err, result) => {
            if (err) {
                return console.log('Error in UsersService.OnSessionCreation', err);
            }
        });
    });
};

//from the event listener on mongo-store "update"
UsersService.OnSessionUpdate = function(sessionId) {

    UserSessionsModel.findOne({ 'sessionId': sessionId })
    .update({ lastActivity: Date.now() })
    .exec((err, result) => {
        if (err) {
            return console.log('Error in UsersService.OnSessionUpdate', err);
        } 
    });
};

UsersService.GetBySessionID = function(sessionId, callback) {
    UserSessionsModel.findOne({ 'sessionId': sessionId })
    .exec((err, result) => {
        if (err) {
            return callback(err);
        }
        return callback(null, result);
    });
};


module.exports = UsersService;
