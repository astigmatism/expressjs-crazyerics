var fs = require('fs');
var async = require('async');
var Dropbox = require('dropbox');
var config = require('config');
var maxSavesPerGame = parseInt(config.get('maxSavesPerGame'), 10);
var dbx = new Dropbox({ 
    accessToken: config.get('dropboxaccesstoken')
});
var SavesModel = require('../models/saves');
//dropbox apis: http://dropbox.github.io/dropbox-sdk-js/Dropbox.html
//mongoose: http://mongoosejs.com/docs/api.html

/**
 * SaveService Constructor
 */
SaveService = function() {
};

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

    //first get saves to determine if we need to prune
    SaveService.GetAllSavesForGame(sessionId, gameKey, function(err, saveDocs) {
        if (err) {
            return callback(err);
        }

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

SaveService.DeleteSave = function(sessionId, gameKey, timeStamp, callback) {
    
    SavesModel.find({ sessionId: sessionId,  gameKey: gameKey, timeStamp: timeStamp }).remove(callback);
};

SaveService.DeleteAllGameSaves = function(sessionId, gameKey, callback) {

    SavesModel.find({ sessionId: sessionId,  gameKey: gameKey }).remove(callback);
};

/**
 * For this, we only need to supply the client with screens, type and time because we will load the state separate when/if they make a selection
 */
SaveService.GetSavesForClient = function(sessionId, gameKey, callback) {

    SavesModel.find({ sessionId: sessionId, gameKey: gameKey })
    .sort({ timeStamp: 1 })
    .select({ timeStamp: 1, screen: 1, type: 1 })
    .lean()
    .exec(callback);
};

SaveService.GetAllSaves = function(sessionId, callback) {

    SavesModel.find({ sessionId: sessionId })
    .sort({ timeStamp: 1 })
    .exec(callback);
};

SaveService.GetAllSavesForGame = function(sessionId, gameKey, callback) {

    SavesModel.find({ sessionId: sessionId, gameKey: gameKey })
    .lean()
    .sort({ timeStamp: 1 })
    .exec(callback)
};

SaveService.GetState = function(sessionId, gameKey, timeStamp, callback) {

    SavesModel.findOne({ sessionId: sessionId, gameKey: gameKey, timeStamp: timeStamp })
    .lean()
    .select({ state: 1})
    .exec(callback)
};

//Dropbox implementation. Not used but perhaps useful later

// SaveService.DeleteSaveDropBox = function(sessionId, gameKey, fileName, callback) {

//     //there is nothing to delete?
//     if (!filename) {
//         return callback(null, null, false);
//     }

//     var path = '/' + sessionId + '/saves/' + gameKey + '/' + fileName + '.json';

//     dbx.filesDelete({ path: path, contents: JSON.stringify(contents) })
//         .then(function (response) {
            
//             callback(null, response, true);
//         })
//         .catch(function (err) {
            
//             callback(err);
//         });
// };

// SaveService.NewSaveDropbox = function(sessionId, gameKey, fileName, screenData, stateData, type, callback) {

//     //write file to save all these details in
//     var contents = {
//         key: fileName,
//         screen: screenData,
//         state: stateData,
//         type: type
//     };

//     var path = '/' + sessionId + '/saves/' + gameKey + '/' + fileName + '.json';

//     //upload file to dropbox!
//     dbx.filesUpload({ path: path, contents: JSON.stringify(contents) })
//         .then(function (response) {
            
//             callback(null, response);
//         })
//         .catch(function (err) {
            
//             callback(err);
//         });
    
// };

module.exports = SaveService;
