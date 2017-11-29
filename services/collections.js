'use strict';
const config = require('config');
const CollectionsSQL = require('../db/collections');
const Cache = require('./cache');
const GameService = require('../services/games');
const UtilitiesService = require('./utilities');

module.exports = new (function() {

    const _self = this;
    var _cacheActiveCollection = new Cache('collections.user.$1.active');
    var _cacheCollectionNames = new Cache('collections.user.$1.names');

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

    //gets, or creates collection by name
    // this.GetCollectionByName = function(userId, collectionName, callback, opt_createIfNoExist) {
        
    //     opt_createIfNoExist = (opt_createIfNoExist == true) ? true : false;
        
    //     _collectionCache.Get([userId, collectionName], (err, cache) => {
    //         if (err) {
    //             return callback(err);
    //         }

    //         if (cache) {
    //             return callback(null, cache);
    //         }

    //         var collection = new CollectionEnvelope();
            
    //         //get collection data first
    //         CollectionsSQL.GetCollectionByName(userId, collectionName, (err, data) => {
    //             if (err) {
    //                 return callback(err);
    //             }
    //             //if exists (or was created)
    //             if (data) {
    //                 collection.data = data; //add to our collection cache

    //                 //fetch all the titles in this collection
    //                 CollectionsSQL.GetCollectionTitles(data.collection_id, (err, titles) => {
    //                     if (err) {
    //                         return callback(err);
    //                     }

    //                     collection.titles = titles; //add to our collection cache

    //                     _collectionCache.Set([userId, collectionName], collection, (err, success) => {
    //                         if (err) {
    //                             return callback(err);
    //                         }
    //                         return callback(null, collection);
    //                     });
    //                 });
    //             }
    //             //does not exist, was not created, bail
    //             else {
    //                 return callback();
    //             }

    //         }, opt_createIfNoExist);
    //     });
    // };

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

                //so here's something pretty cool. if the deleted collection was the active collection,
                //that record is also deleted thanks to CASCASE on delete. The next time we pull values, the default collection will be used
                CollectionsSQL.DeleteCollection(userId, collectionId, (err) => {
                    if (err) { return callback(err); }

                    _cacheCollectionNames.Delete([userId], () => {

                        //delete the active cache if the id is the same
                        _cacheActiveCollection.Get([userId], (err, cache) => {
                            if (err) { return callback(err); }
                            
                            if (cache && cache.collection.collection_id === collectionId) {
                                _cacheActiveCollection.Delete([userId]);
                            }

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
                return callback('The user ' + userId + ' does not down the collection id ' + collectionId);
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

                    CollectionsSQL.GetCollectionTitles(collectionId, (err, titleRecords) => {
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
            //could be user is new
            var defaultCollectionName = config.get('defaultCollection');

            //will create if not exist (with flag)
            CollectionsSQL.GetCollectionByName(userId, defaultCollectionName, (err, collectionRecord) => {
                if (err) { return callback(err); }

                var collectionId = collectionRecord.collection_id;
                CollectionsSQL.SetActiveCollection(userId, collectionId, (err) => {
                    if (err) { return callback(err); }
                    return callback(null, collectionId);
                });

            }, true);
        });
    };

    this.AddTitle = function(userId, eGameKey, callback) {
        
        _self.GetActiveCollection(userId, (err, envelope) => {
            if (err) { return callback(err); }

            var collectionId = envelope.collection.collection_id;

            //adds user_title record to collection
            CollectionsSQL.AddTitle(collectionId, eGameKey.titleId, (err, collectionsTitlesRecord) => {
                if (err) { return callback(err); }

                //reset collection cache
                _cacheActiveCollection.Delete([userId], (err) => {
                    _self.Sync.ready = true; //inform sync that new data is ready for the client to consume
                    return callback();
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
                    _self.Sync.ready = true; //inform sync that new data is ready for the client to consume
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

    // this.MakeFeaturedCollection = function(userId, sort, asc, callback) {

    //     _self.GetActiveCollection(userId, (err, activeCollection) => {
    //         if (err) {
    //             return callback(err);
    //         }

    //         CollectionsSQL.ReassignCollectionWithSort(activeCollection.data.collection_id, 0, sort, asc, (err) => {
    //             if (err) {
    //                 return callback(err);
    //             }
                
    //             //delete caches for both users
    //             _collectionNamesCache.Delete([0], (err, success) => {
    //                 if (err) {
    //                     return callback(err);
    //                 }
                    
    //                 _collectionNamesCache.Delete([userId], (err, success) => {
    //                     if (err) {
    //                         return callback(err);
    //                     }
    //                     callback();
    //                 });
    //             });
    //         });
    //     });
    // };

    //a utility function that clears out the current active collection cache and tells sync to update client
    // var ResetActiveCollectionCacheWithName = function(userId, collectionName, callback) {
        
    //     //invalidate cache
    //     _collectionCache.Delete([userId, collectionName], (err) => {
    //         if (err) {
    //             return callback(err);
    //         }

    //         //inform sync that new collection information is ready for client consumption
    //         //this means that outgoing operations will commence, which rebuilds the cache with new data
    //         _self.Sync.ready = true;
        
    //         return callback();
    //     });
    // };

    this.Sync = new (function() {

        var __self = this;
        this.ready = false;

        var _payload = (function(id, name, titles, collectionNames) {
            this.id = id;
            this.name = name;
            this.titles = titles;
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
                        saveCount: envelope.titles[i].save_count
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

                    var id = EncodeClientCollectionId(envelope.collection.collection_id, envelope.collection.created);

                    var result = new _payload(id, envelope.collection.name, titles, collectionNames);

                    callback(null, result);
                });
            });
        };

        return this;
    })();
    
})();
