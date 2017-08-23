const config = require('config');
const pool = require('./pool.js');
const NodeCache = require('node-cache');
const Cache = require('../services/cache');

const nodecache = new NodeCache({
    stdTTL: 60 * 60 * 24 * 30,      //30 days
    checkperiod: 60 * 60            //1 hour 
});

const UserCache = new Cache('session.$1');

module.exports = new (function() {

    var _self = this;

    this.CreateNewUser = function (sessionId, callback) {
        pool.query('INSERT INTO users (created) VALUES ($1) RETURNING user_id', [new Date], (err, usersResult) => {
            if (err) {
                return callback(err);
            }

            var userId = usersResult.rows[0].user_id;

            pool.query('INSERT INTO users_sessions (user_id, sid) VALUES ($1, $2)', [userId, sessionId], (err, usersSessionsResult) => {
                if (err) {
                    return callback(err);
                }

                //now populate cache with this new user
                this.GetUserWithSessionID(sessionId, (err, user) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, user);
                });
            });
        });
    };

    this.GetUserWithSessionID = function(sessionId, callback) {
        
        UserCache.Get([sessionId], (err, user) => {
            if (err) {
                return callback(err);
            }
            if (user) {
                return callback(null, user);
            }

            pool.query('SELECT users.* FROM users INNER JOIN users_sessions ON (users.user_id = users_sessions.user_id) WHERE users_sessions.sid = $1', [sessionId], (err, usersResult) => {
                if (err) {
                    return callback(err);
                }
                if (usersResult.rows.length === 0) {
                    return callback();
                }
                    
                var user = usersResult.rows[0];
                
                UserCache.Set([sessionId], user, (err, success) => {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, user);
                });
            });
        });
    };

    this.RemoveUsersWithoutSessions = function(callback) {
        pool.query('DELETE FROM users WHERE user_id NOT IN (SELECT user_id FROM users_sessions)', [], (err, result) => {
            if (err) {
                return callback(err);
            }
            return callback();
        });
    };
})();
