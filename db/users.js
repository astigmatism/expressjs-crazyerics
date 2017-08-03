var config = require('config');
const { Pool } = require('pg');
const pool = new Pool(config.get('db.postgre'));

/**
 * Constructor
 */
UsersSQL = function() {
};

UsersSQL.CreateNewUser = function (sessionId, callback) {
    pool.query('INSERT INTO users (created) VALUES ($1) RETURNING user_id', [new Date], (err, usersResult) => {
        if (err) {
            return callback(err);
        }

        var userId = usersResult.rows[0].user_id;

        pool.query('INSERT INTO users_sessions (user_id, sid) VALUES ($1, $2)', [userId, sessionId], (err, usersSessionsResult) => {
            if (err) {
                return callback(err);
            }
            callback();
        });
    });
};

UsersSQL.GetUserWithSessionID = function(sessionId, callback) {
    pool.query('SELECT users.* FROM users INNER JOIN users_sessions ON (users.user_id = users_sessions.user_id) WHERE users_sessions.sid = $1', [sessionId], (err, usersResult) => {
        if (err) {
            return callback(err);
        }
        //if success, return object
        if (usersResult.rows.length > 0) {
            return callback(null, usersResult.rows[0]);
        }
        //otherwise, undef
        return callback();
    });
};

module.exports = UsersSQL;
