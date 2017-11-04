const config = require('config');
const pool = require('./pool.js');
const NodeCache = require('node-cache');

module.exports = new (function() {

    var _self = this;

    //public

    this.NewSave = function(userTitleId, fileId, timestamp, screenData, saveData, type, callback) {
    
        var _self = this;
    
        pool.query('INSERT INTO saves (user_title_id, file_id, client_timestamp, save, screenshot, type) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [userTitleId, fileId, timestamp, saveData, screenData, type], (err, saveInsertResult) => {
            if (err) {
                return callback(err);
            }
            callback(null, saveInsertResult.rows[0]);

            //prune too many saves for this game?
            // GetCache(userTitleId, fileId, (err, cache, key) => {
            //     if (err) {
            //         return callback(err);
            //     }
    
            //     //update cache after insert.
            //     //save id's are in the array in desc order (newest to oldest)
            //     cache.unshift(saveInsertResult.rows[0].save_id); //add newest to front
    
            //     var onPruneCheckComplete = function(prunedRecord) {
            //         nodecache.set(key, cache, (err, success) => {
            //             if (err) {
            //                 return callback(err);
            //             }
            //             callback(null, saveInsertResult.rows[0], prunedRecord); //prunedRecord will be undef if none was pruned
            //         });
            //     }
                
            //     //check number of saves against max
            //     if (cache.length > maxSavesPerGame) {
                    
            //         var prunedSaveId = cache.pop(); //pop oldest off end of array
            //         DeleteSave(prunedSaveId, (err, deleteResult) => {
            //             if (err) {
            //                 return callback(err);
            //             }
            //             onPruneCheckComplete(deleteResult.rows[0]);
            //         });
            //     }
            //     //not thre yet!
            //     else {
            //         onPruneCheckComplete();
            //     }
            // });
        });
    };

    this.GetSaves = function(userId, fileId, callback) {
        
        pool.query('SELECT * FROM saves WHERE user_id=$1 AND file_id=$2 ORDER BY created DESC', [userId, fileId], (err, savesResult) => {
            if (err) {
                return callback(err);
            }
            callback(null, savesResult.rows);
        });
    };

    this.GetSave = function(saveId, callback) {
        
        //the combo of a user_title, file_id and save timestamp are unique
        pool.query('SELECT save FROM saves WHERE save_id=$1', [saveId], (err, saveResult) => {
            if (err) {
                return callback(err);
            }
            
            if (saveResult.rows.length == 0) {
                return callback('User does not own this save or no save found.');
            }
            
            callback(null, saveResult.rows[0].save); //return the binary specifically
        });
    };

    this.DeleteSave = function(saveId, callback) {
        pool.query('DELETE FROM saves WHERE save_id=$1 RETURNING *', [saveId], (err, result) => {
            if (err) {
                return callback(err);
            }
            if (result.rows.length > 0)
            {
                return callback(null, result.rows[0]);
            }
            callback();
        });
    };

})();
