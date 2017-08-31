'use strict';
const config = require('config');
const CollectionsSQL = require('../db/collections');
const PreferencesService = require('./preferences');
const Cache = require('./cache');

module.exports = new (function() { 

    var _self = this;
    var _collectionCache = new Cache('user.$1.collection.$2'); //value is an array of titles in collection

    var CollectionEnvelope = (function() {
        this.data = null;   //details about the current collection (from collections table)
        this.titles = [];   //a list of titles for this collection (from collections_titles table with details from titles and files tables)
    });

    this.GetCollectionByName = function(userId, name, callback, opt_createIfNoExist) {
        
        opt_createIfNoExist = (opt_createIfNoExist == true) ? true : false;
        
        _collectionCache.Get([userId, name], (err, cache) => {
            if (err) {
                return callback(err);
            }

            if (cache) {
                return callback(null, cache);
            }

            var collection = new CollectionEnvelope();
            
            //get collection data first
            CollectionsSQL.GetCollectionByName(userId, name, (err, data) => {
                if (err) {
                    return callback(err);
                }
                //if exists (or was created)
                if (data) {
                    collection.data = data;

                    CollectionsSQL.GetCollectionTitles(data.collection_id, (err, titles) => {
                        if (err) {
                            return callback(err);
                        }

                        collection.titles = titles;

                        _collectionCache.Set([userId, name], collection, (err, success) => {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, collection);
                        });
                    });
                }
                //does not exist, was not created, bail
                else {
                    return callback();
                }

            }, opt_createIfNoExist);
        });
    };

    this.GetCollectionNames = CollectionsSQL.GetCollectionNames;

    this.DeleteCollectionByName = function(userId, name, callback) {
        
        CollectionsSQL.DeleteCollectionByName(userId, name, (err, deletedRecord) => {
            if (err) {
                return callback(err);
            }
            _collectionCache.Delete([userId, name], (err, success) => {
                if (err) {
                    return callback(err);
                }
                callback(null, deletedRecord); 
            });
        });
    };

    const preferencesKeyForActiveCollection = 'collections.active';

    this.GetActiveCollection = function(userId, callback) {

        //get active collection from user prefs, if it doen't exist, then assign the default collection
        PreferencesService.Get(userId, (err, activeCollection) => {
            if (err) {
                return callback(err);
            }

            //assign and cache default if none is already defined (new user path)
            if (!activeCollection) {
                activeCollection = config.get('defaultCollection');
                PreferencesService.SetAsync(userId, preferencesKeyForActiveCollection, activeCollection);
            }

            //get collection (will create if not exist)
            _self.GetCollectionByName(userId, activeCollection, (err, collection) => {
                if (err) {
                    return callback(err);
                }
                return callback(null, collection);
            }, true);

        }, preferencesKeyForActiveCollection);
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

            PreferencesService.Set(userId, preferencesKeyForActiveCollection, collection, (err, success) => {
                if (err) {
                    return callback(err);
                }
                callback(null, success);
            });

        }, preferencesKeyForActiveCollection);
    };

    this.PlayCollectionTitle = function(userId, gk, titleId, fileId, callback) {

        //get collection id
        _self.GetActiveCollection(userId, (err, activeCollection) => {
            if (err) {
                return callback(err);
            }

            var collectionId = activeCollection.data.collection_id;

            //update or inserts the record (play count, last played)
            CollectionsSQL.PlayCollectionTitle(userId, collectionId, gk, titleId, fileId, (err, collectionsTitlesRecord) => {
                if (err) {
                    return callback(err);
                }

                //inform sync that new collection data has arrived
                _self.Sync.ready = true;

                return callback(null, collectionsTitlesRecord);
            });
        });
    };

    this.Sync = new (function() {

        var __self = this;
        this.ready = false;

        var _package = (function(active, collections) {
            this.active = active,
            this.collections = collections;
        });

        //client had new data to update the server
        this.Incoming = function(_package) {

            
        };

        //update the client with new data
        this.Outgoing = function(userId, callback) {


            _self.GetActiveCollection(userId, (err, _activeCollection) => {
                if (err) {
                    return callback(err);
                }

                //sanitize data going to client
                var _sanitizedCollection = {
                    data: {
                        name: _activeCollection.data.name
                    },
                    titles: []
                };

                for (var i = 0, len = _activeCollection.titles.length; i < len; ++i) {
                    _sanitizedCollection.titles.push({
                        gk: _activeCollection.titles[i].game_key,
                        lastPlayed: _activeCollection.titles[i].last_played,
                        playCount: _activeCollection.titles[i].play_count
                    });
                }

                //get list of all collections
                _self.GetCollectionNames(userId, (err, collections) => {
                    if (err) {
                        return callback(err);
                    }

                    //sanitize result as well, didn't see a general need to move this into its own func
                    var names = [];
                    for (var i = 0, len = collections.length; i < len; ++i) {
                        names.push(collections[i].name);
                    }

                    var result = new _package(_sanitizedCollection, names);

                    callback(null, result);
                });
            });
        };

        return this;
    })();
    
})();
