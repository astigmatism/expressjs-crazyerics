var fs = require('fs');
var async = require('async');
var config = require('config');
var CollectionsModel = require('../models/collections');
var UserSessionsModel = require('../models/usersessions');

/**
 * Constructor
 */
CollectionsService = function() {
};

CollectionsService.UpdateCollection = function(sessionId, title, gameKey, callback) {
    
    callback(null);

    // UsersService.GetBySessionID(sessionId, (err, result) => {
    //     if (err) {
    //         return callback(err);
    //     }        

    //     CollectionsModel.findOneAndUpdate({
    //         userId: result.userId,
    //         title: title,
    //     },{ 
    //         $push: {
    //             games: { 
    //                 key: gameKey,
    //                 lastPlayed: Date.now()
    //             }
    //         }
    //     },{ 
    //         upsert: true, 
    //         new: true, 
    //         setDefaultsOnInsert: true 
    //     }, (err, result) => {
    //         if (err) {
    //             return callback(err);
    //         }

    //         callback(null, result);
    //     });
    // });
}

module.exports = CollectionsService;
