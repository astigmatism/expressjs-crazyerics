const config = require('config');
const pool = require('./pool.js');
const Cache = require('../services/cache');
const UserCache = new Cache('session.$1');

module.exports = new (function() {

    var _self = this;

    this.PlayTitle = function(userId, gk, titleId, fileId, callback) {
        
        pool.query('UPDATE users_titles SET active_file=$3, last_played=now(), play_count=play_count+1, game_key=$4 WHERE user_id=$1 AND title_id=$2 RETURNING *', [userId, titleId, fileId, gk], (err, result) => {
            if (err) {
                return callback(err);
            }
            //if update failed to return rows, must be new, insert instead
            if (result.rows.length === 0) {
                
                pool.query('INSERT INTO users_titles (user_id, title_id, active_file, last_played, game_key) VALUES ($1, $2, $3, now(), $4) RETURNING *', [userId, titleId, fileId, gk], (err, result) => {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, result.rows[0]); //insert result
                });
            }
            else {
                return callback(null, result.rows[0]); //update result
            }
        });
    };

    // this.RemoveUsersWithoutSessions = function(callback) {
    //     pool.query('DELETE FROM users WHERE user_id NOT IN (SELECT user_id FROM users_sessions)', [], (err, result) => {
    //         if (err) {
    //             return callback(err);
    //         }
    //         return callback();
    //     });
    // };
})();
