'use strict';
const config = require('config');
const CollectionsSQL = require('../db/collections');
const Cache = require('../services/cache/cache.redis.js');
const UtilitiesService = require('./utilities');

module.exports = new (function() {

    const _self = this;
    var _cacheActiveCollection = new Cache('collections.user.$1.active'); //uses default ttl of 1 hour
    var _cacheCollectionNames = new Cache('collections.user.$1.names'); //uses default ttl of 1 hour

    var CollectionEnvelope = (function() {
        this.collection = null;   //details about the current collection (from collections table)
        this.titles = [];   //a list of titles for this collection (from collections_titles table with details from titles and files tables)
    });

    this.CreateCollection = function(userId, name, callback, opt_makeActive) {

        CollectionsSQL.CreateCollection(userId, name, (err, createResult) => {
            if (err) { return callback(err); }
            
            //invalidate names cache
            _cacheCollectionNames.Delete([userId], (err, success) => {
                _self.Sync.ready = true;

                //make it active now?
                if (opt_makeActive) {
                    _self.SetActiveCollection(userId, createResult.collection_id, () => {
                        return callback(null, createResult);
                    });
                }
                else {
                    return callback(null, createResult);
                }
            });
        });
    };

    this.RenameCollection = function(userId, existingCollectionId, name, callback) {

        DoesUserOwnCollection(userId, existingCollectionId, (err, isOwner) => {
            if (err) { return callback(err); }

            if (isOwner) {

                CollectionsSQL.RenameCollection(userId, existingCollectionId, name, (err, result) => {
                    if (err) { return callback(err); }

                    //invalidate caches
                    _cacheCollectionNames.Delete([userId], (err, success) => {
                        _cacheActiveCollection.Delete([userId], (err, success) => {
                            _self.Sync.ready = true;
                            return callback(null, result);
                        });
                    });

                });

            }
            else {
                return callback('User ' + userId + ' does not own the collection ' + collectionId);
            }
        });
    };

    var GetCollectionNames = function (userId, callback) {
        
        _cacheCollectionNames.Get([userId], (err, cache) => {
            if (err) { return callback(err); }

            if (cache) {
                return callback(null, cache);
            }

            CollectionsSQL.GetCollectionNames(userId, (err, collectionRecords) => {
                if (err) { return callback(err); }

                _cacheCollectionNames.Set([userId], collectionRecords);
                callback(null, collectionRecords);
            });
        });
    };

    this.DeleteCollection = function(userId, collectionId, callback) {

        DoesUserOwnCollection(userId, collectionId, (err, isOwner) => {
            if (err) { return callback(err); }

            if (isOwner) {

                //delete collection from db
                CollectionsSQL.DeleteCollection(userId, collectionId, (err, deleteResult, remainingCollections) => {
                    if (err) { return callback(err); }

                    //handle caches. we can set the names cache with our result but delete the active cache until we know what to do
                    _cacheCollectionNames.Set([userId], remainingCollections);
                    _cacheActiveCollection.Delete([userId], (err, success) => {
                        if (err) { return callback(err); }

                        //which active is active now? Use the cache to determine what remains. in both cases
                        if (remainingCollections.length > 0) {

                            _self.SetActiveCollection(userId, remainingCollections[0].collection_id, (err) => {
                                if (err) { return callback(err); }
                                return callback();
                            });
                            return;
                        }

                        //otherwise the default collection will need to be recreated
                        CreateDefaultCollection(userId, (err, newCollectionId) => {
                            if (err) { return callback(err); }
                            _self.Sync.ready = true;
                            return callback();
                        });
                    });
                });
            }
            else {
                return callback('User ' + userId + ' does not own the collection ' + collectionId);
            }
        })
    };

    var DoesUserOwnCollection = function(userId, collectionId, callback) {
        
        GetCollectionNames(userId, (err, collectionRecords) => {
            if (err) { return callback(err); }
            
            for (var i = 0, len = collectionRecords.length; i < len; ++i) {
                if (collectionRecords[i].collection_id === collectionId) {
                    return callback(null, true);
                }
            }
            return callback(null, false);
        });
    };

    this.SetActiveCollection = function(userId, collectionId, callback) {

        //ensure the user owns this collection first by pulling collection records from cache
        DoesUserOwnCollection(userId, collectionId, (err, ownsCollection) => {
            if (err) { return callback(err); }

            if (ownsCollection) {
                CollectionsSQL.SetActiveCollection(userId, collectionId, (err, result) => {
                    if (err) { return callback(err); }
        
                    _cacheActiveCollection.Delete([userId], () => {
                        _self.Sync.ready = true;
                        return callback();
                    });
                });
            }
            else {
                return callback('The user ' + userId + ' does not own the collection id ' + collectionId);
            }
        });
    };

    //get all details about active collection, this is cached
    this.GetActiveCollection = function(userId, callback) {

        //retrieve cache
        _cacheActiveCollection.Get([userId], (err, cache) => {
            if (err) { return callback(err); }

            if (cache) {
                return callback(null, cache);
            }

            //get id from db, if not there, this process will create the default collection
            GetActiveCollectionId(userId, (err, collectionId) => {
                if (err) { return callback(err); }

                CollectionsSQL.GetCollectionById(userId, collectionId, (err, collectionRecord) => {
                    if (err) { return callback(err); }

                    CollectionsSQL.GetCollectionTitles(userId, collectionId, (err, titleRecords) => {
                        if (err) { return callback(err); }

                        //compose all data into a collection envelope
                        var envelope = new CollectionEnvelope();
                        envelope.collection = collectionRecord;
                        envelope.titles = titleRecords;

                        _cacheActiveCollection.Set([userId], envelope);

                        return callback(null, envelope);
                    })
                });
            });
        });
    };

    var GetActiveCollectionId = function(userId, callback) {
    
        CollectionsSQL.GetActiveCollectionId(userId, (err, collectionId) => {
            if (err) { return callback(err); }

            if (collectionId) {
                return callback(null, collectionId);
            }

            //if here, returned value was undef, a record was not found for active collection.
            // either this user has deleted all their collections or is a new user

            //in this special case, we create a collection using a special character as a special case for
            //a collection which hasn't been named yet.
            CreateDefaultCollection(userId, (err, newCollectionId) => {
                if (err) { return callback(err); }
                return callback(null, newCollectionId);
            });
        });
    };

    var CreateDefaultCollection = function(userId, callback) {

        var defaultCollectionName = config.get('defaults.firstCollection');

        //will create if not exist (with flag)
        CollectionsSQL.GetCollectionByName(userId, defaultCollectionName, (err, collectionRecord) => {
            if (err) { return callback(err); }

            var collectionId = collectionRecord.collection_id;
            
            CollectionsSQL.SetActiveCollection(userId, collectionId, (err) => {
                if (err) { return callback(err); }

                //the collection names cache is also out of sync with the newly created
                _cacheCollectionNames.Delete([userId], (err, success) => {
                    if (err) { return callback(err); }
                
                    return callback(null, collectionId);
                });
            });

        }, true);
    };

    this.AddTitle = function(userId, eGameKey, callback) {
        
        _self.GetActiveCollection(userId, (err, envelope) => {
            if (err) { return callback(err); }

            var collectionId = envelope.collection.collection_id;

            //adds user_title record to collection
            CollectionsSQL.AddTitle(collectionId, eGameKey.titleId, (err, collectionsTitlesRecord) => {
                if (err) { return callback(err); }

                //reset collection cache
                _cacheActiveCollection.Delete([userId], (err, success) => {

                    _self.Sync.ready = true; //inform sync that new data is ready for the client to consume
                    return callback(null, collectionsTitlesRecord);
                }); 
            });
        });
    };

    this.DeleteCollectionTitle = function(userId, eGameKey, callback) {

        _self.GetActiveCollection(userId, (err, envelope) => {
            if (err) { return callback(err); }

            var collectionId = envelope.collection.collection_id;

            //delete this title from the collection
            CollectionsSQL.DeleteTitle(collectionId, eGameKey.titleId, (err, deleteResult) => {
                if (err) { return callback(err); }

                //reset collection cache
                _cacheActiveCollection.Delete([userId], (err) => {
                    _self.Sync.ready = true; //sync will ask for cache data and renew it
                    return callback();
                });
            });
        });
    };

    var EncodeClientCollectionId = function(collectionId, createDate) {
        return UtilitiesService.Compress.json({
            id: collectionId,
            z: createDate //a unique value used for padding/obfuscation
        });
    };

    this.DecodeClientCollectionId = function(value) {
        var data = UtilitiesService.Decompress.json(value);
        return data.id;
    };

    //for external calls, only a userId is needed, we'll look up collection details
    this.ResetActiveCollectionCache = function(userId, callback) {

        _cacheActiveCollection.Delete([userId], () => {
            _self.Sync.ready = true;
            callback();
        });
    };

    this.Sync = new (function() {

        var __self = this;
        this.ready = false;

        var _payload = (function(active, collectionNames) {
            this.active = active;
            this.collections = collectionNames;
        });

        //we don't respond to incoming data about collection from the client through Sync
        this.Incoming = function(_package) {

            console.log(_package);
        };

        //outgoing is how we package the data here on the serverside to the client
        this.Outgoing = function(userId, callback) {

            //client needs to know about active collection and collection names to select
            //will build, get or pull from cache
            _self.GetActiveCollection(userId, (err, envelope) => {
                if (err) { return callback(err); }

                //sanitize data going to client
                var titles = [];

                for (var i = 0, len = envelope.titles.length; i < len; ++i) {
                    titles.push({
                        gk: envelope.titles[i].game_key,
                        lastPlayed: envelope.titles[i].last_played,
                        playCount: envelope.titles[i].play_count,
                        saveCount: envelope.titles[i].save_count,
                        topRanked: envelope.titles[i].top_ranked
                    });
                }

                //get list of all collections
                GetCollectionNames(userId, (err, collectionRecords) => {
                    if (err) {
                        return callback(err);
                    }

                    //sanitize result as well, didn't see a general need to move this into its own func
                    var collectionNames = [];
                    for (var i = 0, len = collectionRecords.length; i < len; ++i) {
                        var id = EncodeClientCollectionId(collectionRecords[i].collection_id, collectionRecords[i].created);
                        collectionNames.push({
                            id: id,
                            name: collectionRecords[i].name,
                            sort: collectionRecords[i].sort,
                            asc: collectionRecords[i].asc
                        });
                    }

                    var active = {
                        id: EncodeClientCollectionId(envelope.collection.collection_id, envelope.collection.created),
                        name: envelope.collection.name,
                        titles: titles
                    }

                    var result = new _payload(active, collectionNames);

                    callback(null, result);
                });
            });
        };

        return this;
    })();
    
})();
