var config = require('config');
const pool = require('./pool.js');
// var NodeCache = require('node-cache');

// const nodecache = new NodeCache({
//     stdTTL: 0,          //unlimited, hold until I delete it
//     checkperiod: 0      //no check
// });

/**
 * Constructor
 */
FilesSQL = function() {
};

FilesSQL.GetFile = function(titleId, name, callback) {

    //var cacheKey = FilesSQL.MakeCacheKey(titleId, name);

    //to avoid a select lookup, check cache first
    // nodecache.get(cacheKey, (err, fileCache) => {
    //     if (err) {
    //         return callback(err);
    //     }

    //     if (fileCache) {
    //         return callback(null, fileCache);
    //     }

        //note: due to the frequency at which I might want to lookup files, I moved the "where not exists" check to AFTER the select attempt

        //select entry either just added or already existed
        pool.query('SELECT * FROM files WHERE title_id=$1 AND name=$2', [titleId, name], (err, filesSelectResult) => {
            if (err) {
                return callback(err);
            }

            //on compete for select or insert
            var onRecordRetrieval = function(fileRecord) {

                // FilesSQL.SetCache(cacheKey, fileRecord, (err, success) => {
                //     if (err) {
                //         return callback(err);
                //     }
                    callback(null, fileRecord);
                //});
            };

            //insert check
            if (filesSelectResult.rows.length == 0) {
                
                FilesSQL.NewFile(titleId, name, (err, fileRecord) => {
                    if (err) {
                        return callback(err);
                    }
                    onRecordRetrieval(fileRecord);
                });
            }
            else {
                onRecordRetrieval(filesSelectResult.rows[0]);
            }
        });
    //});
};

// FilesSQL.MakeCacheKey = function(titleId, name) {
//     return titleId + '.' + name;
// };

// FilesSQL.SetCache = function(key, fileRecord, callback) {
//     nodecache.set(key, fileRecord, (err, success) => {
//         if (err) {
//             return callback(err);
//         }
//         callback(null, success);
//     });
// };

// FilesSQL.ExpireCache = function(titleId, name, callback) {
    
//     var cacheKey = FilesSQL.MakeCacheKey(titleId, name);
    
//     nodecache.del(cacheKey, (err, success) => {
//         if (err) {
//             return callback(err);
//         }
//         callback();
//     });
// };

FilesSQL.NewFile = function(titleId, name, callback) {

    //warning: try not to use suq queres in general. a race condition could exist because of the gap in transactions
    //ok here since I control the table in app and this only runs on start
    pool.query('INSERT INTO files (title_id, name) VALUES ($1,$2) RETURNING *', [titleId, name], (err, filesInsertResult) => {
        if (err) {
            return callback(err);
        }
        callback(null, filesInsertResult.rows[0]);
    });
};

FilesSQL.PlayFile = function(fileId, callback) {
    pool.query('UPDATE files SET play_count = play_count + 1, last_played=$2 WHERE file_id=$1 RETURNING *', [fileId, new Date], (err, filesUpdateResult) => {
        if (err) {
            return callback(err);
        }

        var record = filesUpdateResult.rows[0];
        //var key = FilesSQL.MakeCacheKey(record.title_id, record.name);

        //update cache
        //FilesSQL.SetCache(key, record, (err, success) => {
            callback(null, record);
        //});
    });
};

module.exports = FilesSQL;
