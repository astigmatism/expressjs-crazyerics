'use strict';
const pool = require('./pool.js');

module.exports = new (function() {

    var _self = this;

    this.GetMostPlayed = function (system, limit, callback) {

        //select * from files inner join titles on files.title_id=titles.title_id where titles.system_id='nes' order by play_count desc limit 18
        pool.query('SELECT files.name as file, titles.name as title, systems.name as system_name FROM files INNER JOIN titles on files.title_id=titles.title_id INNER JOIN systems ON titles.system_id=systems.system_id WHERE titles.system_id=$1 ORDER BY files.play_count DESC LIMIT $2', [system, limit], (err, result) => {
            if (err) return callback(err);
            return callback(null, result.rows); //always return array
        });
    };
})();