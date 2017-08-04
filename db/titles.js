var config = require('config');
const { Pool } = require('pg');
const pool = new Pool(config.get('db.postgre'));

/**
 * Constructor
 */
TitlesSQL = function() {
};

//a function which runs on app start which ensures records exist for all systems, will grow db as systems added
TitlesSQL.Exists = function(systemId, name, callback) {

    //would love to get this working.
    //https://stackoverflow.com/questions/23573815/postgres-insert-if-not-exists-otherwise-return-the-row
    //inserts if not exist otherwise selects. just can't get it to return the title_id value I need
    // var query =
    // 'WITH d(s, n) AS ( VALUES ($1, $2)),' +
    // 'n AS (SELECT title_id, name FROM titles, d WHERE name=n),' + 
    // 'i AS (INSERT INTO titles (system_id, name)' + 
    // '        SELECT s,n FROM d WHERE n NOT IN (SELECT name FROM n))' +
    // 'SELECT title_id FROM titles WHERE name IN (SELECT name FROM n)'
    // ;
    
    //warning: try not to use suq queres in general. a race condition could exist because of the gap in transactions
    //ok here since I control the table in app and this only runs on start
    pool.query('INSERT INTO titles (system_id, name) SELECT $1,$2 WHERE NOT EXISTS (SELECT name FROM titles WHERE name = $2) RETURNING title_id', [systemId, name], (err, titlesInsertResult) => {
        if (err) {
            return callback(err);
        }

        //the insert will return the title_id 
        if (titlesInsertResult.rows.length > 0) {
            callback(null, titlesInsertResult.rows[0].title_id);
        }
        //if it didn't then the record already exists, get it
        else {
            pool.query('SELECT title_id FROM titles WHERE system_id=$1 AND name=$2', [systemId, name], (err, titlesSelectResult) => {
                if (err) {
                    return callback(err);
                }
                callback(null, titlesSelectResult.rows[0].title_id);
            });
        }
    });
};

module.exports = TitlesSQL;
