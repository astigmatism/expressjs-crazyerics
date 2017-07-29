var fs = require('fs');
var async = require('async');
var config = require('config');
var UsersModel = require('../models/users');
var UtilitiesService = require('./utilities.js');

/**
 * Constructor
 */
UsersService = function() {
};

//when a session is created, a user is created
UsersService.OnSessionCreation = function(sessionId) {

    var userInstance = new UsersModel({
        sessions: {
            id: sessionId
        }
    });

    userInstance.save((err, result) => {
        if (err) {
            return console.log('Error in UsersService.OnSessionCreation', err);
        }
    });
};

//from the event listener on mongo-store "update"
UsersService.OnSessionUpdate = function(sessionId) {

    UsersModel.findOne({ 'sessions.id': sessionId })
    .update({ 'sessions.$.lastActivity': Date.now() })
    .exec((err, result) => {
        if (err) {
            return console.log('Error in UsersService.OnSessionUpdate', err);
        }
    });
};

UsersService.GetBySessionID = function(sessionId, callback) {

    UsersModel.findOne({ 'sessions.id': sessionId })
    .exec((err, result) => {
        if (err) {
            return callback(err);
        }
        return callback(null, result);
    });
};


module.exports = UsersService;
