var config = require('config');
const { Pool } = require('pg');
const pool = new Pool(config.get('db.postgre'));

/**
 * Constructor
 */
SystemsSQL = function() {
};

//a function which runs on app start which ensures records exist for all systems, will grow db as systems added
SystemsSQL.Exists = function(systemId, name, callback) {

    //warning: try not to use suq queres in general. a race condition could exist because of the gap in transactions
    //ok here since I control the table in app and this only runs on start
    pool.query('INSERT INTO systems (system_id, name, created) SELECT $1,$2,$3 WHERE NOT EXISTS (SELECT system_id FROM systems WHERE system_id = $1)', [systemId, name, new Date], (err, systemsResult) => {
        if (err) {
            return callback(err);
        }
        callback();
    });
};

module.exports = SystemsSQL;
