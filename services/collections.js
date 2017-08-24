'use strict';
const fs = require('fs');
const async = require('async');
const config = require('config');
const CollectionsSQL = require('../db/collections');
const PreferencesService = require('./preferences');

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

    const keyCollectionsActive = 'collections.active';

    this.GetActiveCollection = function(userId, callback) {

        //get active collection from user prefs, if it doen't exist, then assign the default collection
        PreferencesService.Get(userId, (err, activeCollection) => {
            if (err) {
                return callback(err);
            }

            //assign and cache default if none is already defined (new user path)
            if (!activeCollection) {
                activeCollection = config.get('defaultCollection');
                PreferencesService.SetAsync(userId, keyCollectionsActive, activeCollection);
            }

            //get collection (will create if not exist)
            _self.GetCollectionByName(userId, activeCollection, (err, collection) => {
                if (err) {
                    return callback(err);
                }
                return callback(null, collection);
            }, true);

        }, keyCollectionsActive);
    };

    this.SetActiveCollection = function(userId, collection, callback) {

        PreferencesService.Get(userId, (err, activeCollection) => {
            if (err) {
                return callback(err);
            }
            //if no change, bail
            if (activeCollection === collection) {
                return callback();
            }

            PreferencesService.Set(userId, keyCollectionsActive, collection, (err, success) => {
                if (err) {
                    return callback(err);
                }
                callback(null, success);
            });

        }, keyCollectionsActive);
    };

    this.PlayCollectionTitle = function(userId, titleId, fileId, callback) {

        _self.GetActiveCollection(userId, (err, activeCollection) => {
            if (err) {
                return callback(err);
            }

            var collectionId = activeCollection.data.collection_id;

            //update the record
            CollectionsSQL.PlayCollectionTitle(userId, collectionId, titleId, fileId, (err, collectionsTitlesRecord) => {
                if (err) {
                    return callback(err);
                }
                return callback(null, collectionsTitlesRecord);
            });
        });
    }
    
})();
