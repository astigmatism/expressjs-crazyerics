const config = require('config');
const pool = require('./pool.js');

module.exports = new (function() {

    var _self = this;

    //public

    this.NewSave = function(userId, fileId, timestamp, screenData, saveData, type, callback) {
    
        var _self = this;
    
        pool.query('INSERT INTO saves (user_id, file_id, client_timestamp, save, screenshot, type) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [userId, fileId, timestamp, saveData, screenData, type], (err, saveInsertResult) => {
            if (err) {
                return callback(err);
            }
            callback(null, saveInsertResult.rows[0]);
        });
    };

    this.GetSaves = function(userId, fileId, callback) {
        
        pool.query('SELECT * FROM saves WHERE user_id=$1 AND file_id=$2 ORDER BY created DESC', [userId, fileId], (err, savesResult) => {
            if (err) {
                return callback(err);
            }
            callback(null, savesResult.rows);
        });
    };

    this.GetSave = function(saveId, callback) {
        
        //the combo of a user_title, file_id and save timestamp are unique
        pool.query('SELECT save FROM saves WHERE save_id=$1', [saveId], (err, saveResult) => {
            if (err) {
                return callback(err);
            }
            
            if (saveResult.rows.length == 0) {
                return callback('User does not own this save or no save found.');
            }
            
            callback(null, saveResult.rows[0].save); //return the binary specifically
        });
    };

    this.DeleteSave = function(saveId, callback) {
        pool.query('DELETE FROM saves WHERE save_id=$1 RETURNING *', [saveId], (err, result) => {
            if (err) {
                return callback(err);
            }
            if (result.rows.length > 0)
            {
                return callback(null, result.rows[0]);
            }
            callback();
        });
    };

})();
