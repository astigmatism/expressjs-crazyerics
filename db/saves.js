var config = require('config');
const pool = require('./pool.js');
var NodeCache = require('node-cache');

const nodecache = new NodeCache({
    stdTTL: 60 * 60 * 24 * 30,      //30 days (user's session length)
    checkperiod: 60 * 60            //1 hour 
});

/**
 * Constructor
 */
SavesSQL = function() {
};

SavesSQL.NewSave = function(userId, titleId, fileId, timestamp, screenData, saveData, type, callback) {

    var maxSavesPerGame = parseInt(config.get('maxSavesPerGame'), 10);

    pool.query('INSERT INTO saves (user_id, title_id, file_id, client_timestamp, save, screenshot, type) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [userId, titleId, fileId, timestamp, saveData, screenData, type], (err, saveInsertResult) => {
        if (err) {
            return callback(err);
        }
        
        //prune too many saves for this game?
        SavesSQL.GetCache(userId, fileId, (err, cache, key) => {
            if (err) {
                return callback(err);
            }

            //update cache after insert.
            //save id's are in the array in desc order (newest to oldest)
            cache.unshift(saveInsertResult.rows[0].save_id); //add newest to front

            var onPruneCheckComplete = function(prunedRecord) {
                nodecache.set(key, cache, (err, success) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, saveInsertResult.rows[0], prunedRecord); //prunedRecord will be undef if none was pruned
                });
            }
            
            //check number of saves against max
            if (cache.length > maxSavesPerGame) {
                
                var prunedSaveId = cache.pop(); //pop oldest off end of array
                SavesSQL.DeleteSave(prunedSaveId, (err, deleteResult) => {
                    if (err) {
                        return callback(err);
                    }
                    onPruneCheckComplete(deleteResult.rows[0]);
                });
            }
            //not thre yet!
            else {
                onPruneCheckComplete();
            }
        });
    });
};

SavesSQL.MakeCacheKey = function(userId, fileId) {
    return userId + '.' + fileId;
};

SavesSQL.GetCache = function(userId, fileId, callback) {
    
    var key = SavesSQL.MakeCacheKey(userId, fileId);
    
    nodecache.get(key, (err, cache) => {
        if (err) {
            return callback(err);
        }
        if (cache) {
            //nodecache.del(key); //TODO: test else condition with new save next
            return callback(null, cache, key); //return key for convience
        }
        //weird! wasn't cache set when all saves were asked for initially? still handle this, go and populate it (again maybe)
        else {
            SavesSQL.GetSaves(userId, fileId, (err, savesResult) => {
                if (err) {
                    return callback(err);
                }
                SavesSQL.GetCache(userId, fileId, callback); //try again!
            });
        }
    });
};

SavesSQL.GetSaves = function(userId, fileId, callback) {

    pool.query('SELECT * FROM saves WHERE user_id=$1 AND file_id=$2 ORDER BY created DESC', [userId, fileId], (err, savesResult) => {
        if (err) {
            return callback(err);
        }

        //cache the number of saves so when i insert, I know when and what to prune
        //this will work, because we always get saves on game start (before the user can begin saving new saves)
        var key = SavesSQL.MakeCacheKey(userId, fileId);
        var cache = [];
        for (var i = 0, len = savesResult.rows.length; i < len; ++i) {
            cache.push(savesResult.rows[i].save_id);
        }
        nodecache.set(key, cache, (err, success) => {
            if (err) {
                return callback(err);
            }
            callback(null, savesResult.rows);
        });
    });
};

SavesSQL.GetSave = function(userId, timestamp, callback) {
    
    //thankfully, this combo is unique for lookup
    pool.query('SELECT save FROM saves WHERE user_id=$1 AND client_timestamp=$2', [userId, timestamp], (err, saveResult) => {
        if (err) {
            return callback(err);
        }
        
        if (saveResult.rows.length == 0) {
            return callback('User does not own this save or no save found.');
        }
        
        callback(null, saveResult.rows[0].save);
    });
};

SavesSQL.DeleteSave = function(saveId, callback) {
    pool.query('DELETE FROM saves WHERE save_id=$1 RETURNING *', [saveId], (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

module.exports = SavesSQL;
