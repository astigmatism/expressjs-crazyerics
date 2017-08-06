var config = require('config');
const pool = require('./pool.js');

/**
 * Constructor
 */
SystemsSQL = function() {
};

//a function which runs on app start which ensures records exist for all systems, will grow db as systems added
SystemsSQL.Exists = function(system, name, callback) {

    //warning: try not to use suq queres in general. a race condition could exist because of the gap in transactions
    //ok here since I control the table in app and this only runs on start
    pool.query('INSERT INTO systems (system_id, name) SELECT $1,$2 WHERE NOT EXISTS (SELECT system_id FROM systems WHERE system_id = cast($1 as varchar))', [system, name], (err, systemsResult) => {
        if (err) {
            return callback(err);
        }
        callback();
    });
};

module.exports = SystemsSQL;
