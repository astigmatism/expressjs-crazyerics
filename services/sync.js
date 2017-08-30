'use strict';
const async = require('async');
const config = require('config');
const UtilitiesService = require('./utilities');
const FileService = require('./files');
const GamesService = require('./games');

module.exports = new (function() {

    var _self = this;

    this.Incoming = function(req, res, next) {

        if (req.body) {

            //TODO maintain an

        }

        next();
    };

    this.Outgoing = function() {

    };

})();
