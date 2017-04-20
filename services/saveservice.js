var fs = require('fs');
var async = require('async');
var Dropbox = require('dropbox');
var config = require('config');
var dbx = new Dropbox({ 
    accessToken: config.get('dropboxaccesstoken')
});
//dropbox apis: http://dropbox.github.io/dropbox-sdk-js/Dropbox.html

/**
 * SaveService Constructor
 */
SaveService = function() {
};

SaveService.NewSave = function(sessionId, gameKey, fileName, screenData, stateData, saveType, callback) {

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

SaveService.DeleteSave = function(sessionId, gameKey, fileName, callback) {

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

module.exports = SaveService;
