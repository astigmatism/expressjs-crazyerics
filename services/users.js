var fs = require('fs');
var async = require('async');
var config = require('config');
var UtilitiesService = require('./utilities.js');

/**
 * Constructor
 */
UsersService = function() {
};

UsersService.OnSessionCreation = function(a, b, c) {
    console.log('hello world');
};


module.exports = UsersService;
