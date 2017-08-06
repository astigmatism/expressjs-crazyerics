var fs = require('fs');
var async = require('async');
var config = require('config');
var GamesService = require('./games.js');
var SavesSQL = require('../db/saves.js');

/**
 * Constructor
 */
SaveService = function() {
};

SaveService.NewSave = function(userId, system, title, file, timestamp, screenData, stateData, type, callback) {

    //get title and file records (cached likely!)
    GameService.Exists(system, title, file, (err, titleRecord, fileRecord) => {
        if (err) {
            return callback(err);
        }

        SavesSQL.NewSave(userId, titleRecord.title_id, fileRecord.file_id, timestamp, screenData, stateData, type, (err, saveRecord, prunedRecord) => {
            if (err) {
                return callback(err);
            }
            callback(null, saveRecord, prunedRecord);
        });
    });
};

SaveService.GetSaves = function(userId, fileId, callback) {
    SavesSQL.GetSaves(userId, fileId, (err, savesResult) => {
        if (err) {
            return callback(err);
        }
        callback(null, savesResult);
    })
};

//for preparing a simple set of save data to client for save selection
SaveService.GetSavesForClient = function(userId, fileId, callback) {

    SavesSQL.GetSaves(userId, fileId, (err, savesResult) => {
        if (err) {
            return callback(err);
        }

        var result = [];
        for (var i = 0, len = savesResult.length; i < len; ++i) {
            result.push({
                saveId: savesResult[i].save_id,
                type: savesResult[i].type,
                timestamp: savesResult[i].client_timestamp,
                screenshot: savesResult[i].screenshot
            });
        }
        callback(null, result);
    });
};

SaveService.GetSave = function(userId, timestamp, callback) {

    //thankfully, this combo is unique
    SavesSQL.GetSave(userId, timestamp, (err, compressedSaveState) => {
        if (err) {
            return callback(err);
        }
        callback(null, compressedSaveState);
    });
};

module.exports = SaveService;
