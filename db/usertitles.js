const config = require('config');
const pool = require('./pool.js');

module.exports = new (function() {

    var _self = this;

    this.PlayTitle = function(userId, gk, titleId, fileId, isPlayingTopRanked, callback) {
        
        pool.query('UPDATE users_titles SET active_file=$3, last_played=now(), play_count=play_count+1, game_key=$4, top_ranked=$5 WHERE user_id=$1 AND title_id=$2 RETURNING *', [userId, titleId, fileId, gk, isPlayingTopRanked], (err, result) => {
            if (err) {
                return callback(err);
            }
            //if update failed to return rows, must be new, insert instead
            if (result.rows.length === 0) {
                
                _self.AddTitle(userId, gk, titleId, fileId, 1, new Date(), isPlayingTopRanked, (err, result) => {
                    return callback(err, result); //insert result
                });
            }
            else {
                return callback(null, result.rows[0]); //update result
            }
        });
    };

    this.AddTitle = function(userId, gk, titleId, fileId, play_count, lastPlayed, isPlayingTopRanked, callback) {

        pool.query('ALTER TABLE ONLY users_titles ALTER COLUMN play_count SET DEFAULT 0', [], (err) => {
            if (err) {
                return callback(err);
            }

            /*
             * Add to Collection should be idempotent for a user/title. The
             * collection membership table is title-based, so inserting duplicate
             * users_titles rows for the same title later expands one shelf game
             * into multiple rows during collection reads and breaks exact order
             * validation. Preserve the existing user title record when present.
             */
            pool.query(
                'SELECT * FROM users_titles WHERE user_id=$1 AND title_id=$2' +
                ' ORDER BY last_played DESC NULLS LAST, play_count DESC NULLS LAST, active_file DESC NULLS LAST, ctid DESC LIMIT 1',
                [userId, titleId],
                (err, selectResult) => {
                    if (err) {
                        return callback(err);
                    }

                    if (selectResult.rows.length > 0) {
                        return callback(null, selectResult.rows[0]);
                    }

                    pool.query(
                        'INSERT INTO users_titles (user_id, title_id, active_file, play_count, last_played, game_key, top_ranked) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                        [userId, titleId, fileId, play_count, lastPlayed, gk, isPlayingTopRanked],
                        (err, result) => {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, result.rows[0]); //insert result
                        }
                    );
                }
            );
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
