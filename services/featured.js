'use strict';
const async = require('async');
const config = require('config');
const UtilitiesService = require('../services/utilities.js');
const FilesService = require('../services/files.js');
const Cache = require('../services/cache');

module.exports = new (function() {

    const _self = this;
    const _path = '/data/featured/';

    this.Create = function(name, gks, callback) {

        //will replace will already exists
        FilesService.WriteFile(_path + name, JSON.stringify(gks), (err) => {
            if (err) return callback(err);
            callback();
        });

    };

})();
