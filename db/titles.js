var config = require('config');
const pool = require('./pool.js');

/**
 * Constructor
 */
TitlesSQL = function() {
};

TitlesSQL.GetTitle = function(systemId, name, callback) {

    //select entry either just added or already existed
    pool.query('SELECT * FROM titles WHERE system_id=$1 AND name=$2', [systemId, name], (err, titlesSelectResult) => {
        if (err) {
            return callback(err);
        }

        //on compete for select or insert
        var onRecordRetrieval = function(titleRecord) {

            callback(null, titleRecord);
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
