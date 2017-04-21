var fs = require('fs');
var async = require('async');
var Dropbox = require('dropbox');
var config = require('config');
var maxsaves = parseInt(config.get('maxsaves'), 10);
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

SaveService.NewSave = function(sessionId, gameKey, timeStamp, screenData, stateData, saveType, callback) {

    // Create an instance of model SomeModel
    var saveInstance = new SavesModel({ 
        sessionId: sessionId,
        gameKey: gameKey,
        timeStamp: timeStamp,
        screen: screenData,
        state: stateData,
        saveType: saveType
    });

    //first get saves to determine if we need to prune
    SaveService.GetAllSavesForGame(sessionId, gameKey, function(err, saveDocs) {
        if (err) {
            return callback(err);
        }

        if (saveDocs.length >= maxsaves) {
            SaveService.DeleteSave(saveDocs[0]._id); //the 0 index holds the oldest save for this game
        }

        // Save the new model instance, passing a callback
        saveInstance.save(function(err, doc) {
            if (err) {
                return callback(err);
            }
            callback(null, doc._id); //callback with mongo unique key
        }); 
    });
};

SaveService.DeleteSave = function(saveId, callback) {
    
    SavesModel.find({ _id: saveId }).remove(callback);
};

SaveService.GetAllSaveScreens = function(sessionId, gameKey, callback) {

    SavesModel.find({ sessionId: sessionId, gameKey: gameKey })
    .sort({ timeStamp: 1 })
    .select({ timeStamp: 1, screen: 1, saveType: 1})
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

//Dropbox implementation. Not used but perhaps useful later

SaveService.DeleteSaveDropBox = function(sessionId, gameKey, fileName, callback) {

    //there is nothing to delete?
    if (!filename) {
        return callback(null, null, false);
    }

    var path = '/' + sessionId + '/saves/' + gameKey + '/' + fileName + '.json';

    dbx.filesDelete({ path: path, contents: JSON.stringify(contents) })
        .then(function (response) {
            
            callback(null, response, true);
        })
        .catch(function (err) {
            
            callback(err);
        });
};

SaveService.NewSaveDropbox = function(sessionId, gameKey, fileName, screenData, stateData, saveType, callback) {

    //write file to save all these details in
    var contents = {
        key: fileName,
        screen: screenData,
        state: stateData,
        type: saveType
    };

    var path = '/' + sessionId + '/saves/' + gameKey + '/' + fileName + '.json';

    //upload file to dropbox!
    dbx.filesUpload({ path: path, contents: JSON.stringify(contents) })
        .then(function (response) {
            
            callback(null, response);
        })
        .catch(function (err) {
            
            callback(err);
        });
    
};

module.exports = SaveService;
