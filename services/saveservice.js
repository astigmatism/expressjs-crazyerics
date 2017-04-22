var fs = require('fs');
var async = require('async');
var config = require('config');
var maxSavesPerGame = parseInt(config.get('maxSavesPerGame'), 10);
var SavesModel = require('../models/saves');
// var Dropbox = require('dropbox');
// var dbx = new Dropbox({ 
//     accessToken: config.get('dropboxaccesstoken')
// });
//dropbox apis: http://dropbox.github.io/dropbox-sdk-js/Dropbox.html
//mongoose: http://mongoosejs.com/docs/api.html

/**
 * Constructor
 */
SaveService = function() {
};

/**
 * Adds a new save to mongo. screen and state data have been compressed on the client
 * @param  {String} sessionId
 * @param  {String} gameKey
 * @param  {Number} timeStamp
 * @param  {String} screenData
 * @param  {String} stateData
 * @param  {String} type
 * @param  {Function} callback
 */
SaveService.NewSave = function(sessionId, gameKey, timeStamp, screenData, stateData, type, callback) {

    var deleteSaveTimeStamp = null;

    // Create an instance of model SomeModel
    var saveInstance = new SavesModel({ 
        sessionId: sessionId,
        gameKey: gameKey,
        timeStamp: timeStamp,
        screen: screenData,
        state: stateData,
        type: type
    });

    //obtain all saves for this game but obtain everything since we need to use its values (not just a count)
    SaveService.GetAllSavesForGame(sessionId, gameKey, function(err, saveDocs) {
        if (err) {
            return callback(err);
        }

        //saveDocs is sorted oldest to newest, the 0 index holds the oldest save
        if (saveDocs.length >= maxSavesPerGame) {
            var oldestSave = saveDocs[0];
            deleteSaveTimeStamp = oldestSave.timeStamp;
            SaveService.DeleteSave(oldestSave.sessionId, oldestSave.gameKey, oldestSave.timeStamp, function(err, result) {
                //no need to wait here
            });
        }

        // Save the new model instance, passing a callback
        saveInstance.save(function(err, doc) {
            if (err) {
                return callback(err);
            }
            callback(null, doc._id, deleteSaveTimeStamp); //callback with mongo unique key
        }); 
    });
};

/**
 * Deletes a specific save by timestamp for a given user and game
 * @param  {String} sessionId
 * @param  {String} gameKey
 * @param  {Number} timeStamp
 * @param  {Function} callback
 */
SaveService.DeleteSave = function(sessionId, gameKey, timeStamp, callback) {
    
    SavesModel.find({ sessionId: sessionId,  gameKey: gameKey, timeStamp: timeStamp }).remove(callback);
};
/**
 * Delete all saves for a user and a game
 * @param  {String} sessionId
 * @param  {String} gameKey
 * @param  {Function} callback
 */
SaveService.DeleteAllGameSaves = function(sessionId, gameKey, callback) {

    SavesModel.find({ sessionId: sessionId,  gameKey: gameKey }).remove(callback);
};
/**
 * Returns a count of documents for a given user and game
 * @param  {String} sessionId
 * @param  {String} gameKey
 * @param  {Function} callback
 */
SaveService.GetSaveCountForGame = function(sessionId, gameKey, callback) {

    SavesModel.find({ sessionId: sessionId,  gameKey: gameKey })
    .count(function(err, count) {
        if (err) {
            return callback(err);
        }
        callback(null, count);
    });
};

/**
 * For this, we only need to supply the client with screens, type and time because we will load the state separate when/if they make a selection
 * @param  {String} sessionId
 * @param  {String} gameKey
 * @param  {Function} callback
 */
SaveService.GetSavesForClient = function(sessionId, gameKey, callback) {

    SavesModel.find({ sessionId: sessionId, gameKey: gameKey })
    .sort({ timeStamp: 1 })
    .select({ timeStamp: 1, screen: 1, type: 1 })
    .lean()
    .exec(callback);
};

/**
 * Get all saves for al games for a given user
 * @param  {String} sessionId
 * @param  {Function} callback
 */
SaveService.GetAllSaves = function(sessionId, callback) {

    SavesModel.find({ sessionId: sessionId })
    .sort({ timeStamp: 1 })
    .exec(callback);
};

/**
 * Return all saves for a given game and user
 * @param  {String} sessionId
 * @param  {String} gameKey
 * @param  {Function} callback
 */
SaveService.GetAllSavesForGame = function(sessionId, gameKey, callback) {

    SavesModel.find({ sessionId: sessionId, gameKey: gameKey })
    .lean()
    .sort({ timeStamp: 1 })
    .exec(callback)
};
/**
 * Return state data for a given user, game and timestamp
 * @param  {String} sessionId
 * @param  {String} gameKey
 * @param  {String} timeStamp
 * @param  {Functon} callback
 */
SaveService.GetState = function(sessionId, gameKey, timeStamp, callback) {

    SavesModel.findOne({ sessionId: sessionId, gameKey: gameKey, timeStamp: timeStamp })
    .lean()
    .select({ state: 1})
    .exec(callback)
};

module.exports = SaveService;
