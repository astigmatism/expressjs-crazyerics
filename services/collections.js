'use strict';
const config = require('config');
const CollectionsSQL = require('../db/collections');
const PreferencesService = require('./preferences');
const Cache = require('./cache');
const GameService = require('../services/games');

module.exports = new (function() { 

    var _self = this;
    var _collectionCache = new Cache('collections.user.$1.collection.$2'); //value is an array of titles in collection with their data

    var CollectionEnvelope = (function() {
        this.data = null;   //details about the current collection (from collections table)
        this.titles = [];   //a list of titles for this collection (from collections_titles table with details from titles and files tables)
    });

    this.GetCollectionByName = function(userId, collectionName, callback, opt_createIfNoExist) {
        
        opt_createIfNoExist = (opt_createIfNoExist == true) ? true : false;
        
        _collectionCache.Get([userId, collectionName], (err, cache) => {
            if (err) {
                return callback(err);
            }

            if (cache) {
                return callback(null, cache);
            }

            var collection = new CollectionEnvelope();
            
            //get collection data first
            CollectionsSQL.GetCollectionByName(userId, collectionName, (err, data) => {
                if (err) {
                    return callback(err);
                }
                //if exists (or was created)
                if (data) {
                    collection.data = data; //add to our collection cache

                    //fetch all the titles in this collection
                    CollectionsSQL.GetCollectionTitles(data.collection_id, (err, titles) => {
                        if (err) {
                            return callback(err);
                        }

                        collection.titles = titles; //add to our collection cache

                        _collectionCache.Set([userId, collectionName], collection, (err, success) => {
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

    this.DeleteCollectionByName = function(userId, collectionName, callback) {
        
        CollectionsSQL.DeleteCollectionByName(userId, collectionName, (err, deletedRecord) => {
            if (err) {
                return callback(err);
            }
            _collectionCache.Delete([userId, collectionName], (err, success) => {
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
        PreferencesService.Get(userId, (err, activeCollectionName) => {
            if (err) {
                return callback(err);
            }

            //assign and cache default if none is already defined (new user path)
            if (!activeCollectionName) {
                activeCollectionName = config.get('defaultCollection');
                PreferencesService.SetAsync(userId, preferencesKeyForActiveCollection, activeCollectionName);
            }

            //get collection (will create if not exist)
            _self.GetCollectionByName(userId, activeCollectionName, (err, collection) => {
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

    //get title data out of the collection using a gamekey
    this.GetTitle = function(userId, gameKey, callback) {

        _self.GetActiveCollection(userId, (err, activeCollection) => {
            if (err) {
                return callback(err);
            }

            var titles = activeCollection.titles;

            //search through collection titles until we have a match
            for (var i = 0, len = titles.length; i < len; ++i) {
                if (titles[i].game_key === gameKey.gk) {
                    return callback(null, titles[i]);
                }
            }
            callback();
        });
    };

    this.AddTitle = function(userId, eGameKey, callback) {
        
        //get collection id
        _self.GetActiveCollection(userId, (err, activeCollection) => {
            if (err) {
                return callback(err);
            }

            var collectionId = activeCollection.data.collection_id;
            var collectionName = activeCollection.data.name;

            //adds user_title record to collection
            CollectionsSQL.AddTitle(collectionId, eGameKey.titleId, (err, collectionsTitlesRecord) => {
                if (err) {
                    return callback(err);
                }

                //reset cache and flag sync to update client
                ResetActiveCollectionCacheWithName(userId, collectionName, (err) => {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, collectionsTitlesRecord);
                });
            });
        });
    };

    this.DeleteCollectionTitle = function(userId, eGameKey, callback) {

        //deletes can only take place from the currently active collection so get it
        _self.GetActiveCollection(userId, (err, activeCollection) => {
            if (err) {
                return callback(err);
            }

            var collectionId = activeCollection.data.collection_id;
            var collectionName = activeCollection.data.name;

            //delete this title from the collection
            CollectionsSQL.DeleteTitle(collectionId, eGameKey.titleId, (err, deleteResult) => {
                if (err) {
                    return callback(err);
                }

                //reset local cache for this collection, set the sync flag to update the client
                _self.ResetActiveCollectionCacheWithName(userId, collectionName, (err) => {
                    if (err) {
                        return callback(err);
                    }
                    return callback();
                });
            });
        });
    };

    //for external calls, only a userId is needed, we'll look up collection details
    this.ResetActiveCollectionCache = function(userId, callback) {
        
        _self.GetActiveCollection(userId, (err, activeCollection) => {
            if (err) {
                return callback(err);
            }

            var collectionName = activeCollection.data.name;

            ResetActiveCollectionCacheWithName(userId, collectionName, callback);
        });
    };

    //a utility function that clears out the current active collection cache and tells sync to update client
    var ResetActiveCollectionCacheWithName = function(userId, collectionName, callback) {
        
        //invalidate cache
        _collectionCache.Delete([userId, collectionName], (err) => {
            if (err) {
                return callback(err);
            }

            //inform sync that new collection information is ready for client consumption
            //this means that outgoing operations will commence, which rebuilds the cache with new data
            _self.Sync.ready = true;
        
            return callback();
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

            console.log(_package);
        };

        //update the client with new data
        this.Outgoing = function(userId, callback) {

            //pulls from, or will rebuild cache
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
                        playCount: _activeCollection.titles[i].play_count,
                        saveCount: _activeCollection.titles[i].save_count
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
