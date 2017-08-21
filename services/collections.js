'use strict';
const fs = require('fs');
const async = require('async');
const config = require('config');
const CollectionsSQL = require('../db/collections');
const UsersSQL = require('../db/users');

module.exports = new (function() { 

    var _self = this;

    this.GetCollectionByName = function(userId, name, callback, opt_createIfNotExist) {
        
        opt_createIfNotExist = (opt_createIfNotExist == true) ? true : false;

        CollectionsSQL.GetCollectionByName(userId, name, (err, collection) => {
            if (err) {
                return callback(err);
            }
            if (collection) {
                return callback(null, collection);
            }
            //no exist and didn't want to create it
            else {
                return callback();
            }
            
        }, opt_createIfNotExist);
    };

    this.GetCollectionNames = CollectionsSQL.GetCollectionNames;
    
})();
