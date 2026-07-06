'use strict';

const pool = require('./pool.js');

module.exports = new (function() {

    var _self = this;

    this.GetMostRecentlyPlayed = function(options, callback) {
        options = NormalizeOptions(options);

        var params = [];
        var where = ['files.last_played IS NOT NULL'];

        AddSystemFilter(where, params, options.system);

        QueryTitles(where, params, 'files.last_played DESC, files.play_count DESC, titles.name ASC, files.name ASC', options.limit, callback);
    };

    this.GetMostPlayed = function(options, callback) {
        options = NormalizeOptions(options);

        var params = [];
        var where = ['COALESCE(files.play_count, 0) >= $1'];
        params.push(options.minPlayCount || 1);

        AddSystemFilter(where, params, options.system);

        QueryTitles(where, params, 'files.play_count DESC, files.last_played DESC NULLS LAST, titles.name ASC, files.name ASC', options.limit, callback);
    };

    this.GetByType = function(type, options, callback) {
        switch (type) {
            case 'mostRecentlyPlayed':
                return _self.GetMostRecentlyPlayed(options, callback);
            case 'mostPlayed':
                return _self.GetMostPlayed(options, callback);
            default:
                return callback('Unsupported site statistic collection type: ' + type);
        }
    };

    var NormalizeOptions = function(options) {
        options = options || {};

        var limit = parseInt(options.limit, 10);
        if (isNaN(limit) || limit < 1) {
            limit = 12;
        }
        if (limit > 100) {
            limit = 100;
        }

        var minPlayCount = parseInt(options.minPlayCount, 10);
        if (isNaN(minPlayCount) || minPlayCount < 1) {
            minPlayCount = 1;
        }

        return {
            system: NormalizeSystem(options.system),
            limit: limit,
            minPlayCount: minPlayCount
        };
    };

    var NormalizeSystem = function(system) {
        system = String(system || '').trim();
        return system || null;
    };

    var AddSystemFilter = function(where, params, system) {
        if (!system) {
            return;
        }

        params.push(system);
        where.push('titles.system_id=$' + params.length);
    };

    var QueryTitles = function(where, params, orderBy, limit, callback) {
        params.push(limit);

        var sql = [
            'SELECT',
            'files.file_id,',
            'files.name AS file,',
            'COALESCE(files.play_count, 0) AS play_count,',
            'files.last_played,',
            'titles.title_id,',
            'titles.name AS title,',
            'titles.system_id,',
            'systems.name AS system_name',
            'FROM files',
            'INNER JOIN titles ON files.title_id=titles.title_id',
            'LEFT JOIN systems ON titles.system_id=systems.system_id',
            'WHERE ' + where.join(' AND '),
            'ORDER BY ' + orderBy,
            'LIMIT $' + params.length
        ].join(' ');

        pool.query(sql, params, (err, result) => {
            if (err) {
                return callback(err);
            }

            callback(null, result.rows || []);
        });
    };
})();
