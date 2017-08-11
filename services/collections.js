'use strict';
const fs = require('fs');
const async = require('async');
const config = require('config');
const CollectionsSQL = require('../db/collections');

module.exports = new (function() { 

    //as no additional work is performed by the service, create direct mapping to data layer
    this.GetCollectionByName = CollectionsSQL.GetCollectionByName;

    this.CreateCollection = CollectionsSQL.CreateCollection;
    
})();
