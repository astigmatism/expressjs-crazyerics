var config = require('config');
const pool = require('./pool.js');
var NodeCache = require('node-cache');

const nodecache = new NodeCache({
    stdTTL: 60 * 60 * 24 * 30,      //30 days
    checkperiod: 60 * 60            //1 hour 
});

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
    
    //get from cache first
    var key = UsersSQL.MakeCacheKey(sessionId);
    
    nodecache.get(key, (err, user) => {
        if (err) {
            return callback(err);
        }

        if (user) {
            return callback(null, user);
        }
        else {

            pool.query('SELECT users.* FROM users INNER JOIN users_sessions ON (users.user_id = users_sessions.user_id) WHERE users_sessions.sid = $1', [sessionId], (err, usersResult) => {
                if (err) {
                    return callback(err);
                }
                
                //if success, cache it
                if (usersResult.rows.length > 0) {
                    
                    nodecache.set(key, usersResult.rows[0], (err, success) => {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null, usersResult.rows[0]);
                    });
                } 
                else {
                    return callback();
                }
            });
        }
    });
};

UsersSQL.MakeCacheKey = function(sessionId) {
    return 'session.' + sessionId;
}

UsersSQL.RemoveUsersWithoutSessions = function(callback) {

    pool.query('DELETE FROM users WHERE user_id NOT IN (SELECT user_id FROM users_sessions)', [], (err, result) => {
        if (err) {
            return callback(err);
        }
        return callback();
    });
};

UsersSQL.UpdatePlayerPreferences = function(sessionId, userId, data, callback) {

    pool.query('UPDATE users SET preferences=$1 WHERE user_id=$2 RETURNING *', [JSON.stringify(data), userId], (err, updateResult) => {
        if (err) {
            return callback(err);
        }

        //update cache
        var key = UsersSQL.MakeCacheKey(sessionId);
        nodecache.set(key, updateResult.rows[0], (err, success) => {
            if (err) {
                return callback(err);
            }
            return callback(null, updateResult.rows[0]);
        });
    });
};

module.exports = UsersSQL;
