var config = require('config');
const { Pool } = require('pg');
const pool = new Pool(config.get('db.postgre'));

/**
 * Constructor
 */
FilesSQL = function() {
};

//a function which runs on app start which ensures records exist for all systems, will grow db as systems added
FilesSQL.Exists = function(titleId, name, callback) {

    //warning: try not to use suq queres in general. a race condition could exist because of the gap in transactions
    //ok here since I control the table in app and this only runs on start
    pool.query('INSERT INTO files (title_id, name) SELECT $1,$2 WHERE NOT EXISTS (SELECT name FROM files WHERE name = $2) RETURNING file_id', [titleId, name], (err, filesInsertResult) => {
        if (err) {
            return callback(err);
        }

        //the insert will return the title_id 
        if (filesInsertResult.rows.length > 0) {
            callback(null, filesInsertResult.rows[0].file_id);
        }
        //if it didn't then the record already exists, get it
        else {
            pool.query('SELECT file_id FROM files WHERE title_id=$1 AND name=$2', [titleId, name], (err, filesSelectResult) => {
                if (err) {
                    return callback(err);
                }
                callback(null, filesSelectResult.rows[0].file_id);
            });
        }
    });
};

module.exports = FilesSQL;
