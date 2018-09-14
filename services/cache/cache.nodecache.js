'use strict';
const util = require('util');
const config = require('config');
const NodeCache = require('node-cache');
const colors = require('colors');
const CacheBase = require('./cache.base');

//standard cache if no custom was defined.
//this definition is strongly designed around users and their estimated session length (1 hour max?)
const defaultOptions = {
    stdTTL: 0,                   //unlimited
    checkperiod: 0               //no check
};

module.exports = function(key, opt_options) {

    var _self = this;
    
    var options = opt_options || defaultOptions;
    var _cache = new NodeCache(options);
    var _base = new CacheBase(this, key);

    this.Get = _base.Get;
    this.Set = _base.Set;
    this.Delete = _base.Delete;

    this.name = 'node-cache';

    this.get = function(key, callback) {
        _cache.get(key, callback);
    }

    this.set = function(key, value, callback) {
        _cache.set(key, value, callback);
    }

    this.delete = function(key, callback) {
        _cache.del(key, callback);
    }
};
