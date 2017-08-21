const config = require('config');
const pool = require('./pool.js');
const NodeCache = require('node-cache');

const nodecache = new NodeCache({
    stdTTL: 60 * 60 * 24 * 30,      //30 days
    checkperiod: 60 * 60            //1 hour 
});

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
    
        //get from cache first
        var key = MakeCacheKey(sessionId);
        
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
                        
                        var user = usersResult.rows[0];

                        //lets json parse necessary data
                        try {
                            user.preferences = JSON.parse(user.preferences);
                            if (!user.preferences) {
                                user.preferences = {};
                            }
                        }
                        catch (e) {
                            user.preferences = {}; //if cannot parse, assume ruined and erase all user prefereces ;)
                        }
                        
                        //add flag to show where data came from (mostly for debugging purposes, you can remove this later if you want)
                        var cacheUser = user;
                        cacheUser.source = 'cache';
                        user.source = 'data';

                        nodecache.set(key, cacheUser, (err, success) => {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, user);
                        });
                    } 
                    else {
                        return callback(); //allow user not found, handled by service layer
                    }
                });
            }
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

    this.UpdatePlayerPreferences = function(sessionId, userId, data, callback) {
        pool.query('UPDATE users SET preferences=$1 WHERE user_id=$2 RETURNING *', [JSON.stringify(data), userId], (err, updateResult) => {
            if (err) {
                return callback(err);
            }

            //update cache

            _self.GetUserWithSessionID(sessionId, (err, user) => {
                if (err) {
                    return callback(err);
                }
                return callback(null, user);
            }); 
        });
    };

    var MakeCacheKey = function(sessionId) {
        return 'session.' + sessionId;
    }

})();
