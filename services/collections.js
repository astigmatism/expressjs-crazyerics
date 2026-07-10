'use strict';
const config = require('config');
const CollectionsSQL = require('../db/collections');
const Cache = require('../services/cache/cache.redis.js');
const UtilitiesService = require('./utilities');
const FileService = require('./files');
const GameService = require('./games');

module.exports = new (function() {

    const _self = this;
    var _cacheActiveCollection = new Cache('collections.user.$1.active'); //uses default ttl of 1 hour
    var _cacheCollectionNames = new Cache('collections.user.$1.names'); //uses default ttl of 1 hour

    var CollectionEnvelope = (function() {
        this.collection = null;   //details about the current collection (from collections table)
        this.titles = [];   //a list of titles for this collection (from collections_titles table with details from titles and files tables)
    });

    var EmptyCollectionEnvelope = function() {
        return new CollectionEnvelope();
    };

    var CollectionOrderError = function(message, status) {
        var err = new Error(message);
        err.safeStatus = status || 400;
        err.safeMessage = message;
        return err;
    };

    var NormalizeOrderTitleId = function(value) {

        var n;

        if (typeof value === 'number') {
            n = value;
        }
        else if (typeof value === 'string' && value.trim() !== '') {
            n = parseInt(value, 10);
        }
        else {
            return null;
        }

        if (!isFinite(n) || n < 1 || Math.floor(n) !== n) {
            return null;
        }

        return n;
    };

    var BuildCurrentCollectionOrderIndex = function(titleRecords) {

        var result = {
            titleIds: [],
            gameKeys: [],
            byTitleId: {},
            byGameKey: {},
            rawCount: 0
        };
        var record;
        var titleId;
        var gk;
        var i;

        titleRecords = titleRecords || [];
        result.rawCount = titleRecords.length;

        for (i = 0; i < titleRecords.length; ++i) {
            record = titleRecords[i];
            titleId = record ? NormalizeOrderTitleId(record.title_id) : null;
            gk = record && record.game_key ? String(record.game_key) : null;

            if (titleId !== null && !result.byTitleId.hasOwnProperty(titleId)) {
                result.byTitleId[titleId] = record;
                result.titleIds.push(titleId);
            }

            if (gk && !result.byGameKey.hasOwnProperty(gk)) {
                result.byGameKey[gk] = record;
                result.gameKeys.push(gk);
            }
        }

        return result;
    };

    var LogCollectionOrderValidationFailure = function(reason, details) {

        details = details || {};

        console.log('Collection order validation failed: ' + reason, {
            userId: details.userId,
            collectionId: details.collectionId,
            rawCurrentCount: details.rawCurrentCount,
            currentTitleCount: details.currentTitleCount,
            currentGameKeyCount: details.currentGameKeyCount,
            requestedTitleCount: details.requestedTitleCount,
            requestedGameKeyCount: details.requestedGameKeyCount
        });
    };

    var ValidateCollectionOrderByTitleId = function(userId, collectionId, orderIndex, orderedTitleIds) {

        var normalized = [];
        var seen = {};
        var titleId;
        var i;

        if (!Array.isArray(orderedTitleIds)) {
            return { err: CollectionOrderError('Collection order must be an array of game identifiers.') };
        }

        if (orderedTitleIds.length !== orderIndex.titleIds.length) {
            LogCollectionOrderValidationFailure('title id length mismatch', {
                userId: userId,
                collectionId: collectionId,
                rawCurrentCount: orderIndex.rawCount,
                currentTitleCount: orderIndex.titleIds.length,
                currentGameKeyCount: orderIndex.gameKeys.length,
                requestedTitleCount: orderedTitleIds.length
            });
            return { err: CollectionOrderError('Collection order must contain exactly the games already in this collection.') };
        }

        for (i = 0; i < orderedTitleIds.length; ++i) {
            titleId = NormalizeOrderTitleId(orderedTitleIds[i]);

            if (titleId === null) {
                return { err: CollectionOrderError('Collection order contains an invalid game identifier.') };
            }

            if (seen[titleId]) {
                return { err: CollectionOrderError('Collection order cannot contain duplicate games.') };
            }

            if (!orderIndex.byTitleId.hasOwnProperty(titleId)) {
                return { err: CollectionOrderError('Collection order contains a game that is not in this collection.') };
            }

            seen[titleId] = true;
            normalized.push(titleId);
        }

        for (i = 0; i < orderIndex.titleIds.length; ++i) {
            if (!seen[orderIndex.titleIds[i]]) {
                return { err: CollectionOrderError('Collection order is missing a game from this collection.') };
            }
        }

        return { orderedTitleIds: normalized };
    };

    var ValidateCollectionOrderByGameKey = function(userId, collectionId, orderIndex, orderedGameKeys) {

        var orderedTitleIds = [];
        var requestedSeen = {};
        var gk;
        var record;
        var titleId;
        var i;

        if (!Array.isArray(orderedGameKeys)) {
            return { err: CollectionOrderError('Collection order must be an array of game identifiers.') };
        }

        if (orderedGameKeys.length !== orderIndex.gameKeys.length) {
            LogCollectionOrderValidationFailure('game key length mismatch', {
                userId: userId,
                collectionId: collectionId,
                rawCurrentCount: orderIndex.rawCount,
                currentTitleCount: orderIndex.titleIds.length,
                currentGameKeyCount: orderIndex.gameKeys.length,
                requestedGameKeyCount: orderedGameKeys.length
            });
            return { err: CollectionOrderError('Collection order must contain exactly the games already in this collection.') };
        }

        for (i = 0; i < orderedGameKeys.length; ++i) {
            gk = orderedGameKeys[i];

            if (!gk || typeof gk !== 'string') {
                return { err: CollectionOrderError('Collection order contains an invalid game identifier.') };
            }

            if (requestedSeen[gk]) {
                return { err: CollectionOrderError('Collection order cannot contain duplicate games.') };
            }

            record = orderIndex.byGameKey[gk];

            if (!record) {
                return { err: CollectionOrderError('Collection order contains a game that is not in this collection.') };
            }

            titleId = NormalizeOrderTitleId(record.title_id);

            if (titleId === null) {
                return { err: CollectionOrderError('Collection order contains an invalid game identifier.') };
            }

            requestedSeen[gk] = true;
            orderedTitleIds.push(titleId);
        }

        for (i = 0; i < orderIndex.gameKeys.length; ++i) {
            if (!requestedSeen[orderIndex.gameKeys[i]]) {
                return { err: CollectionOrderError('Collection order is missing a game from this collection.') };
            }
        }

        return { orderedTitleIds: orderedTitleIds };
    };

    var NormalizeManualOrder = function(value, fallback) {
        value = parseInt(value, 10);
        fallback = parseInt(fallback, 10);

        if (isNaN(value)) {
            return isNaN(fallback) ? 0 : fallback;
        }

        return value;
    };

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

                    //handle caches. Set the names cache with the post-delete result before sync
                    //can read it, and delete the active cache until we know what to do.
                    _cacheCollectionNames.Set([userId], remainingCollections, (err) => {
                        if (err) { return callback(err); }

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

                            //otherwise there are truly no collections left. Clear the persisted active
                            //collection instead of recreating the unnamed default collection shell.
                            CollectionsSQL.ClearActiveCollection(userId, (err) => {
                                if (err) { return callback(err); }
                                _self.Sync.ready = true;
                                return callback();
                            });
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

            //get id from db, if not there, this process may select an existing collection
            //but it will not create an unnamed/default collection for a true empty library.
            GetActiveCollectionId(userId, (err, collectionId) => {
                if (err) { return callback(err); }

                if (!collectionId) {
                    var emptyEnvelope = EmptyCollectionEnvelope();
                    _cacheActiveCollection.Set([userId], emptyEnvelope);
                    return callback(null, emptyEnvelope);
                }

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

            GetCollectionNames(userId, (err, collectionRecords) => {
                if (err) { return callback(err); }

                if (collectionRecords.length === 0) {
                    if (!collectionId) {
                        return callback(null, null);
                    }

                    return CollectionsSQL.ClearActiveCollection(userId, (err) => {
                        if (err) { return callback(err); }
                        _cacheActiveCollection.Delete([userId], (err) => {
                            if (err) { return callback(err); }
                            _self.Sync.ready = true;
                            return callback(null, null);
                        });
                    });
                }

                for (var i = 0, len = collectionRecords.length; i < len; ++i) {
                    if (collectionRecords[i].collection_id === collectionId) {
                        return callback(null, collectionId);
                    }
                }

                CollectionsSQL.SetActiveCollection(userId, collectionRecords[0].collection_id, (err) => {
                    if (err) { return callback(err); }

                    _cacheActiveCollection.Delete([userId], (err) => {
                        if (err) { return callback(err); }
                        _self.Sync.ready = true;
                        return callback(null, collectionRecords[0].collection_id);
                    });
                });
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

                //the collection names and active caches are also out of sync with the newly created collection
                _cacheCollectionNames.Delete([userId], (err, success) => {
                    if (err) { return callback(err); }

                    _cacheActiveCollection.Delete([userId], (err) => {
                        if (err) { return callback(err); }

                        return callback(null, collectionId);
                    });
                });
            });

        }, true);
    };

    this.AddTitle = function(userId, eGameKey, callback) {

        var AddTitleToActiveEnvelope = function(envelope) {

            if (!envelope || !envelope.collection) {
                return CreateDefaultCollection(userId, (err) => {
                    if (err) { return callback(err); }

                    _self.GetActiveCollection(userId, (err, newEnvelope) => {
                        if (err) { return callback(err); }
                        AddTitleToActiveEnvelope(newEnvelope);
                    });
                });
            }

            var collectionId = envelope.collection.collection_id;

            //adds user_title record to collection
            CollectionsSQL.AddTitle(collectionId, eGameKey.titleId, (err, collectionsTitlesRecord) => {
                if (err) { return callback(err); }

                //reset collection cache
                _cacheActiveCollection.Delete([userId], (err, success) => {
                    if (err) { return callback(err); }

                    _self.Sync.ready = true; //inform sync that new data is ready for the client to consume
                    return callback(null, collectionsTitlesRecord);
                }); 
            });
        };

        _self.GetActiveCollection(userId, (err, envelope) => {
            if (err) { return callback(err); }
            AddTitleToActiveEnvelope(envelope);
        });
    };

    this.DeleteCollectionTitle = function(userId, eGameKey, callback) {

        _self.GetActiveCollection(userId, (err, envelope) => {
            if (err) { return callback(err); }

            if (!envelope || !envelope.collection) {
                return callback();
            }

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

    this.ReorderActiveCollection = function(userId, collectionId, orderedGameKeys, orderedTitleIds, callback) {

        var useTitleIds;

        if (typeof orderedTitleIds === 'function') {
            callback = orderedTitleIds;
            orderedTitleIds = null;
        }

        orderedGameKeys = orderedGameKeys || [];
        useTitleIds = Array.isArray(orderedTitleIds) && orderedTitleIds.length > 0;

        if (!useTitleIds && !Array.isArray(orderedGameKeys)) {
            return callback(CollectionOrderError('Collection order must be an array of game identifiers.'));
        }

        DoesUserOwnCollection(userId, collectionId, (err, isOwner) => {
            if (err) { return callback(err); }

            if (!isOwner) {
                return callback(CollectionOrderError('Only the owner can reorder this collection.', 403));
            }

            /*
             * This is a write path, so validate against the current database
             * state instead of the active-collection cache. The exact order is
             * title-based because collections_titles stores title_id, while the
             * client still sends game keys as a compatibility fallback.
             */
            CollectionsSQL.GetActiveCollectionId(userId, (err, activeCollectionId) => {
                if (err) { return callback(err); }

                if (parseInt(activeCollectionId, 10) !== parseInt(collectionId, 10)) {
                    return callback(CollectionOrderError('The requested collection is not the active personal collection.'));
                }

                CollectionsSQL.GetCollectionTitles(userId, collectionId, (err, titleRecords) => {
                    if (err) { return callback(err); }

                    var orderIndex = BuildCurrentCollectionOrderIndex(titleRecords);
                    var validation = useTitleIds ?
                        ValidateCollectionOrderByTitleId(userId, collectionId, orderIndex, orderedTitleIds) :
                        ValidateCollectionOrderByGameKey(userId, collectionId, orderIndex, orderedGameKeys);
                    var orderedTitleIdsToSave;
                    var updatedTitleIds;
                    var updatedCount;
                    var titleIdKey;
                    var updateRows;
                    var i;

                    if (validation.err) {
                        return callback(validation.err);
                    }

                    orderedTitleIdsToSave = validation.orderedTitleIds;

                    CollectionsSQL.UpdateTitleOrder(collectionId, orderedTitleIdsToSave, (err, rows) => {
                        if (err) { return callback(err); }

                        updateRows = rows || [];
                        updatedTitleIds = {};
                        updatedCount = 0;

                        for (i = 0; i < updateRows.length; ++i) {
                            titleIdKey = String(updateRows[i].title_id);

                            if (!updatedTitleIds[titleIdKey]) {
                                updatedTitleIds[titleIdKey] = true;
                                updatedCount++;
                            }
                        }

                        if (updatedCount !== orderedTitleIdsToSave.length) {
                            return callback(CollectionOrderError('Collection order could not be saved because one or more games were not updated.'));
                        }

                        _cacheActiveCollection.Delete([userId], (err) => {
                            if (err) { return callback(err); }

                            _self.Sync.ready = true;
                            return callback(null, { ok: true });
                        });
                    });
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

    var BuildClientTitlePayload = function(titleRecords, callback) {

        var result = [];
        titleRecords = titleRecords || [];

        var next = function(index) {

            if (index >= titleRecords.length) {
                return callback(null, result);
            }

            var record = titleRecords[index];
            var clientTitle = {
                gk: record.game_key,
                titleId: record.title_id,
                lastPlayed: record.last_played,
                playCount: record.play_count,
                saveCount: record.save_count,
                topRanked: null,
                selectedFile: null,
                defaultFile: null,
                manualOrder: NormalizeManualOrder(record.collection_position, index)
            };

            GetVersionMetadata(record.game_key, (err, versionMetadata) => {
                if (err) {
                    console.log('Collection version metadata lookup failed:', err && err.message ? err.message : err);
                }

                if (versionMetadata) {
                    clientTitle.topRanked = versionMetadata.isTopRanked;
                    clientTitle.selectedFile = versionMetadata.selectedFile;
                    clientTitle.defaultFile = versionMetadata.defaultFile;
                }
                else if (record.top_ranked === true || record.top_ranked === false) {
                    clientTitle.topRanked = record.top_ranked;
                }

                GetReleaseMetadata(record.game_key, (err, releaseMetadata) => {
                    if (err) {
                        console.log('Collection release metadata lookup failed:', err && err.message ? err.message : err);
                    }

                    if (releaseMetadata) {
                        clientTitle.releaseSort = releaseMetadata.sort;
                        clientTitle.releaseLabel = releaseMetadata.label;
                    }

                    result.push(clientTitle);
                    next(index + 1);
                });
            });
        };

        next(0);
    };

    var GetVersionMetadata = function(gk, callback) {

        var gameKey;

        try {
            gameKey = UtilitiesService.Decompress.gamekey(gk);
        }
        catch (err) {
            return callback(null, null);
        }

        if (!gameKey || !gameKey.system || !gameKey.title || !gameKey.file) {
            return callback(null, null);
        }

        GameService.GetVersionInfo(gameKey, callback);
    };

    var GetReleaseMetadata = function(gk, callback) {

        var gameKey;

        try {
            gameKey = UtilitiesService.Decompress.gamekey(gk);
        }
        catch (err) {
            return callback(null, null);
        }

        if (!gameKey || !gameKey.system || !gameKey.title) {
            return callback(null, null);
        }

        FileService.Get('/data/' + gameKey.system + '_metadata', (err, metadata) => {
            if (err || !metadata || !metadata[gameKey.title]) {
                return callback(null, null);
            }

            callback(null, ExtractReleaseMetadata(metadata[gameKey.title]));
        });
    };

    var ExtractReleaseMetadata = function(metadata) {

        if (!metadata) {
            return null;
        }

        var releaseDate = GetFirstMetadataValue(metadata, ['ReleaseDate', 'releaseDate', 'release_date']);
        var releaseYear = GetFirstMetadataValue(metadata, ['ReleaseYear', 'releaseYear', 'release_year', 'Year', 'year']);
        var parsedDate = ParseReleaseDate(releaseDate);

        if (parsedDate) {
            return {
                sort: parsedDate.getTime(),
                label: String(releaseDate)
            };
        }

        var parsedYear = parseInt(releaseYear, 10);
        if (!isNaN(parsedYear) && parsedYear > 0) {
            return {
                sort: new Date(parsedYear, 0, 1).getTime(),
                label: String(parsedYear)
            };
        }

        return null;
    };

    var GetFirstMetadataValue = function(metadata, keys) {

        for (var i = 0, len = keys.length; i < len; ++i) {
            if (metadata.hasOwnProperty(keys[i]) && metadata[keys[i]] !== null && metadata[keys[i]] !== '') {
                return metadata[keys[i]];
            }
        }

        return null;
    };

    var ParseReleaseDate = function(value) {

        if (value === null || value === undefined || value === '') {
            return null;
        }

        if (value instanceof Date && !isNaN(value.getTime())) {
            return value;
        }

        var rawValue = String(value).trim();

        if (!rawValue) {
            return null;
        }

        var normalizedValue = NormalizeReleaseDateText(rawValue);
        var parts = ParseIsoReleaseDate(normalizedValue) ||
            ParseCompactReleaseDate(normalizedValue) ||
            ParseNumericReleaseDate(normalizedValue) ||
            ParseMonthNameReleaseDate(normalizedValue) ||
            ParseYearOnlyReleaseDate(normalizedValue) ||
            ParseNativeReleaseDate(normalizedValue);

        if (!parts) {
            return null;
        }

        return BuildReleaseDate(parts.year, parts.month, parts.day);
    };

    var NormalizeReleaseDateText = function(value) {

        return String(value)
            .replace(/\u00a0/g, ' ')
            .replace(/,/g, ' ')
            .replace(/\b([A-Za-z]{3,})\./g, '$1')
            .replace(/\s+/g, ' ')
            .trim();
    };

    var ParseIsoReleaseDate = function(value) {

        var datePart = '(?:\\d{1,2}|0{1,2}|x{1,2}|X{1,2}|\\?{1,2})';
        var match = value.match(new RegExp('^(\\d{4})(?:[-\\/.](' + datePart + ')(?:[-\\/.](' + datePart + '))?)?$'));

        if (!match) {
            match = value.match(new RegExp('^(\\d{4})[-\\/.](' + datePart + ')(?:[-\\/.](' + datePart + '))?(?:[T\\s].*)$'));
        }

        if (!match) {
            return null;
        }

        return NormalizeDateParts(match[1], match[2], match[3]);
    };

    var ParseCompactReleaseDate = function(value) {

        var match = value.match(/^(\d{4})(\d{2})(\d{2})$/);
        if (match) {
            return NormalizeDateParts(match[1], match[2], match[3]);
        }

        match = value.match(/^(\d{4})(\d{2})$/);
        if (match) {
            return NormalizeDateParts(match[1], match[2], '1');
        }

        return null;
    };

    var ParseNumericReleaseDate = function(value) {

        var match = value.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);

        if (match) {
            var first = parseInt(match[1], 10);
            var second = parseInt(match[2], 10);

            // Most LaunchBox-style month/day dates are US-formatted. If the first
            // segment cannot be a month, treat it as day/month instead.
            if (first > 12 && second <= 12) {
                return NormalizeDateParts(match[3], match[2], match[1]);
            }

            return NormalizeDateParts(match[3], match[1], match[2]);
        }

        match = value.match(/^(\d{1,2})[-\/.](\d{4})$/);

        if (match) {
            return NormalizeDateParts(match[2], match[1], '1');
        }

        return null;
    };

    var ParseMonthNameReleaseDate = function(value) {

        var monthPattern = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
        var match = value.match(new RegExp('^' + monthPattern + '(?:\\s+(?:of\\s+)?)?(?:(\\d{1,2})(?:st|nd|rd|th)?\\s+)?(\\d{4})$', 'i'));

        if (match) {
            return NormalizeDateParts(match[3], MonthNameToNumber(match[1]), match[2] || '1');
        }

        match = value.match(new RegExp('^(\\d{1,2})(?:st|nd|rd|th)?\\s+' + monthPattern + '\\s+(\\d{4})$', 'i'));

        if (match) {
            return NormalizeDateParts(match[3], MonthNameToNumber(match[2]), match[1]);
        }

        match = value.match(new RegExp('^(\\d{4})\\s+' + monthPattern + '(?:\\s+(\\d{1,2})(?:st|nd|rd|th)?)?$', 'i'));

        if (match) {
            return NormalizeDateParts(match[1], MonthNameToNumber(match[2]), match[3] || '1');
        }

        return null;
    };

    var ParseYearOnlyReleaseDate = function(value) {

        var match = value.match(/(?:^|\D)(\d{4})(?:\D|$)/);

        if (!match) {
            return null;
        }

        return NormalizeDateParts(match[1], '1', '1');
    };

    var ParseNativeReleaseDate = function(value) {

        var date = new Date(value);

        if (isNaN(date.getTime())) {
            return null;
        }

        return NormalizeDateParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    };

    var MonthNameToNumber = function(value) {

        if (!value) {
            return null;
        }

        var month = String(value).toLowerCase().substr(0, 3);

        switch (month) {
            case 'jan': return 1;
            case 'feb': return 2;
            case 'mar': return 3;
            case 'apr': return 4;
            case 'may': return 5;
            case 'jun': return 6;
            case 'jul': return 7;
            case 'aug': return 8;
            case 'sep': return 9;
            case 'oct': return 10;
            case 'nov': return 11;
            case 'dec': return 12;
            default: return null;
        }
    };

    var NormalizeDateParts = function(year, month, day) {

        year = parseInt(year, 10);
        month = NormalizeDatePart(month, 1);
        day = NormalizeDatePart(day, 1);

        if (isNaN(year) || year < 1800 || year > 2200) {
            return null;
        }

        if (month < 1 || month > 12) {
            month = 1;
        }

        if (day < 1 || day > 31) {
            day = 1;
        }

        return {
            year: year,
            month: month,
            day: day
        };
    };

    var NormalizeDatePart = function(value, defaultValue) {

        if (value === null || value === undefined || value === '') {
            return defaultValue;
        }

        value = String(value).trim();

        if (!value || value === '0' || value === '00' || /^x+$/i.test(value) || /^\?+$/.test(value)) {
            return defaultValue;
        }

        var result = parseInt(value, 10);

        if (isNaN(result)) {
            return defaultValue;
        }

        return result;
    };

    var BuildReleaseDate = function(year, month, day) {

        var date = new Date(Date.UTC(year, month - 1, day));

        if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
            return null;
        }

        return date;
    };

    // Exposed for featured collections so the release-date default sort can use the
    // same metadata lookup and parsing rules as personal collections.
    this.GetReleaseMetadata = GetReleaseMetadata;

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

        var _payload = (function(active, collectionNames, collectionToolsStorageKey) {
            this.active = active;
            this.collections = collectionNames;
            this.collectionToolsStorageKey = collectionToolsStorageKey;
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

                //sanitize data going to client. Release metadata is read from the
                //same per-system metadata files used by suggestions, but a missing
                //metadata file or title-level date should never block collection sync.
                BuildClientTitlePayload(envelope.titles, (err, titles) => {
                    if (err) { return callback(err); }

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
                            id: null,
                            name: null,
                            titles: titles
                        };

                        if (envelope.collection) {
                            active.id = EncodeClientCollectionId(envelope.collection.collection_id, envelope.collection.created);
                            active.name = envelope.collection.name;
                        }

                        var collectionToolsStorageKey = UtilitiesService.Compress.string('collection-tools:' + userId);
                        var result = new _payload(active, collectionNames, collectionToolsStorageKey);

                        callback(null, result);
                    });
                });
            });
        };


        return this;
    })();
    
})();
