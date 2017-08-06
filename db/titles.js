var config = require('config');
const pool = require('./pool.js');
var NodeCache = require('node-cache');

const nodecache = new NodeCache({
    stdTTL: 0,          //unlimited, hold until I delete it
    checkperiod: 0      //no check
});

/**
 * Constructor
 */
TitlesSQL = function() {
};

TitlesSQL.GetTitle = function(systemId, name, callback) {

    var cacheKey = TitlesSQL.MakeCacheKey(systemId, name);

    //to avoid a select lookup, check cache first
    nodecache.get(cacheKey, (err, titleCache) => {
        if (err) {
            return callback(err);
        }

        if (titleCache) {
            return callback(null, titleCache);
        }

        //note: due to the frequency at which I might want to lookup titles, I moved the "where not exists" check to AFTER the select attempt

        //select entry either just added or already existed
        pool.query('SELECT * FROM titles WHERE system_id=$1 AND name=$2', [systemId, name], (err, titlesSelectResult) => {
            if (err) {
                return callback(err);
            }

            //on compete for select or insert
            var onRecordRetrieval = function(titleRecord) {

                TitlesSQL.SetCache(cacheKey, titleRecord, (err, success) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, titleRecord);
                });
            };

            //insert check
            if (titlesSelectResult.rows.length == 0) {
                
                TitlesSQL.NewTitle(systemId, name, (err, titleRecord) => {
                    if (err) {
                        return callback(err);
                    }
                    onRecordRetrieval(titleRecord);
                });
            }
            else {
                onRecordRetrieval(titlesSelectResult.rows[0]);
            }
        });
    });
};

TitlesSQL.MakeCacheKey = function(systemId, name) {
    return systemId + '.' + name;
};

TitlesSQL.SetCache = function(key, titleRecord, callback) {
    nodecache.set(key, titleRecord, (err, success) => {
        if (err) {
            return callback(err);
        }
        callback(null, success);
    });
};

TitlesSQL.ExpireCache = function(systemId, name, callback) {
    
    var cacheKey = TitlesSQL.MakeCacheKey(systemId, name);
    
    nodecache.del(cacheKey, (err, success) => {
        if (err) {
            return callback(err);
        }
        callback();
    });
};

TitlesSQL.NewTitle = function(systemId, name, callback) {

    //warning: try not to use suq queres in general. a race condition could exist because of the gap in transactions
    //ok here since I control the table in app and this only runs on start
    pool.query('INSERT INTO titles (system_id, name) VALUES ($1,$2) RETURNING *', [systemId, name], (err, titlesInsertResult) => {
        if (err) {
            return callback(err);
        }
        callback(null, titlesInsertResult.rows[0]);
    });
};

module.exports = TitlesSQL;
