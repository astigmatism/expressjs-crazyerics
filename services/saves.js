'use strict';
const async = require('async');
const config = require('config');
const GamesService = require('./games');
const SavesSQL = require('../db/saves');

module.exports = new (function() {

    var _self = this;

    this.NewSave = function(userId, gameKey, timestamp, screenData, stateData, type, callback) {
        
        //get title and file records (cached likely!)
        GamesService.Exists(gameKey, (err, titleRecord, fileRecord) => {
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

    this.GetSaves = function(userId, fileId, callback) {
        SavesSQL.GetSaves(userId, fileId, (err, savesResult) => {
            if (err) {
                return callback(err);
            }
            callback(null, savesResult);
        })
    };

    //for preparing a simple set of save data to client for save selection
    this.GetSavesForClient = function(userId, fileId, callback) {
        
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

    this.GetSave = function(userId, timestamp, callback) {
        
        //thankfully, this combo is unique
        SavesSQL.GetSave(userId, timestamp, (err, compressedSaveState) => {
            if (err) {
                return callback(err);
            }
            callback(null, compressedSaveState);
        });
    };
})();
