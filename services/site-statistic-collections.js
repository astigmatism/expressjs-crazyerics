'use strict';

const async = require('async');
const config = require('config');
const SiteStatisticCollectionsSQL = require('../db/site-statistic-collections');
const CollectionsService = require('./collections');
const UtilitiesService = require('./utilities');
const Cache = require('./cache/cache.nodecache');

const SiteStatisticCollectionsCache = new Cache('site-statistic-collections');

module.exports = new (function() {

    const _self = this;
    const _defaultRefreshIntervalSeconds = 300;
    const _minimumRefreshIntervalSeconds = 30;
    const _maximumRefreshIntervalSeconds = 24 * 60 * 60;
    const _maximumLimit = 100;
    const _allowedTypes = {
        mostRecentlyPlayed: true,
        mostPlayed: true
    };
    const _typeDefaults = {
        mostRecentlyPlayed: {
            label: 'Recently Played',
            icon: '\u25f7',
            sort: 'lastPlayed'
        },
        mostPlayed: {
            label: 'Most Played',
            icon: '\u25c6',
            sort: 'playCount'
        }
    };

    var _refreshTimer = null;
    var _refreshInProgress = false;
    var _lastRefreshStarted = null;

    this.ApplicationStart = function(callback) {

        callback = callback || function() {};

        _self.RefreshAll((err, payload) => {
            if (err) {
                console.log('Site statistic collections startup refresh failed:', err && err.message ? err.message : err);
            }

            ScheduleRefresh();
            callback(err, payload);
        });
    };

    this.RefreshAll = function(callback) {

        callback = callback || function() {};

        if (_refreshInProgress) {
            return _self.GetAllCached(callback);
        }

        _refreshInProgress = true;
        _lastRefreshStarted = new Date();

        var definitions = GetEnabledDefinitions();
        var collections = [];

        if (definitions.length < 1) {
            return StorePayload(BuildPayload([], GetSharedRefreshIntervalSeconds(definitions), _lastRefreshStarted), (err, payload) => {
                _refreshInProgress = false;
                callback(err, payload);
            });
        }

        async.eachSeries(definitions, function(definition, nextDefinition) {
            BuildCollection(definition, function(err, collection) {
                if (err) {
                    console.log('Site statistic collection refresh failed for ' + definition.id + ':', err && err.message ? err.message : err);
                    return nextDefinition();
                }

                if (collection && collection.gks && collection.gks.length > 0) {
                    collection.index = collections.length;
                    collections.push(collection);
                }

                nextDefinition();
            });
        }, function(err) {
            if (err) {
                _refreshInProgress = false;
                return callback(err);
            }

            StorePayload(BuildPayload(collections, GetSharedRefreshIntervalSeconds(definitions), _lastRefreshStarted), function(storeErr, payload) {
                _refreshInProgress = false;

                if (!storeErr) {
                    _self.Sync.ready = true;
                }

                callback(storeErr, payload);
            });
        });
    };

    this.GetAllCached = function(callback) {

        SiteStatisticCollectionsCache.Get([], (err, cache) => {
            if (err) {
                return callback(err);
            }

            if (cache) {
                return callback(null, cache);
            }

            if (_refreshInProgress) {
                return callback(null, BuildPayload([], GetSharedRefreshIntervalSeconds(GetEnabledDefinitions()), _lastRefreshStarted || new Date()));
            }

            _self.RefreshAll(callback);
        });
    };

    this.GetRandomPayload = function(opt_quantity, callback) {

        if (typeof opt_quantity === 'function') {
            callback = opt_quantity;
            opt_quantity = 1;
        }

        opt_quantity = NormalizeSelectionQuantity(opt_quantity);

        _self.GetAllCached((err, payload) => {
            if (err) {
                return callback(err);
            }

            var collections = payload && payload.collections ? payload.collections : [];

            if (!collections.length) {
                return callback(null, BuildPayload([], payload && payload.refreshIntervalSeconds, payload && payload.refreshedAt));
            }

            var randomIndex = Math.floor(Math.random() * collections.length);
            var selected = [];

            for (var i = 0; i < opt_quantity && i < collections.length; ++i) {
                var collection = CloneCollection(collections[(randomIndex + i) % collections.length]);
                collection.index = i;
                selected.push(collection);
            }

            callback(null, BuildPayload(selected, payload.refreshIntervalSeconds, payload.refreshedAt));
        });
    };

    this.GetPayloadById = function(id, callback) {

        id = NormalizeIdentifier(id);

        if (!id) {
            return callback('Missing site statistic collection id.');
        }

        _self.GetAllCached((err, payload) => {
            if (err) {
                return callback(err);
            }

            var collections = payload && payload.collections ? payload.collections : [];

            for (var i = 0, len = collections.length; i < len; ++i) {
                if (collections[i].id === id) {
                    var selected = CloneCollection(collections[i]);
                    selected.index = 0;
                    return callback(null, BuildPayload([selected], payload.refreshIntervalSeconds, payload.refreshedAt));
                }
            }

            callback(null, BuildPayload([], payload && payload.refreshIntervalSeconds, payload && payload.refreshedAt));
        });
    };

    this.GetById = function(id, callback) {

        id = NormalizeIdentifier(id);

        if (!id) {
            return callback('Missing site statistic collection id.');
        }

        _self.GetAllCached((err, payload) => {
            if (err) {
                return callback(err);
            }

            var collections = payload && payload.collections ? payload.collections : [];

            for (var i = 0, len = collections.length; i < len; ++i) {
                if (collections[i].id === id) {
                    return callback(null, collections[i]);
                }
            }

            callback(null, null);
        });
    };

    this.Sync = new (function() {

        var __self = this;
        this.ready = false;

        this.Incoming = function() {
            return;
        };

        this.Outgoing = function(callback) {
            __self.ready = false;
            _self.GetAllCached(callback);
        };

        return this;
    })();

    var ScheduleRefresh = function() {

        if (_refreshTimer) {
            clearInterval(_refreshTimer);
            _refreshTimer = null;
        }

        var definitions = GetEnabledDefinitions();
        var intervalSeconds = GetSharedRefreshIntervalSeconds(definitions);

        if (definitions.length < 1 || intervalSeconds < 1) {
            return;
        }

        _refreshTimer = setInterval(function() {
            _self.RefreshAll(function(err) {
                if (err) {
                    console.log('Site statistic collections periodic refresh failed:', err && err.message ? err.message : err);
                }
            });
        }, intervalSeconds * 1000);

        if (_refreshTimer && _refreshTimer.unref) {
            _refreshTimer.unref();
        }
    };

    var StorePayload = function(payload, callback) {
        SiteStatisticCollectionsCache.Set([], payload, function(err) {
            if (err) {
                return callback(err);
            }

            callback(null, payload);
        });
    };

    var BuildPayload = function(collections, refreshIntervalSeconds, refreshedAt) {
        return {
            collections: CloneCollections(collections),
            refreshIntervalSeconds: refreshIntervalSeconds,
            refreshedAt: refreshedAt || new Date()
        };
    };

    var BuildCollection = function(definition, callback) {

        SiteStatisticCollectionsSQL.GetByType(definition.type, definition, (err, rows) => {
            if (err) {
                return callback(err);
            }

            BuildClientCollection(definition, rows || [], callback);
        });
    };

    var BuildClientCollection = function(definition, rows, callback) {

        var gks = [];
        var titles = [];
        var seen = {};

        async.eachSeries(rows, function(row, nextRow) {
            if (!row || !row.system_id || !row.title || !row.file) {
                return nextRow();
            }

            var gk = UtilitiesService.Compress.gamekey(row.system_id, row.title, row.file);

            if (!gk || seen[gk]) {
                return nextRow();
            }

            seen[gk] = true;
            gks.push(gk);

            BuildClientTitleMetadata(gk, row, function(err, title) {
                if (err) {
                    console.log('Site statistic collection metadata lookup failed:', err && err.message ? err.message : err);
                    title = BuildFallbackTitleMetadata(gk, row);
                }

                titles.push(title);
                nextRow();
            });
        }, function(err) {
            if (err) {
                return callback(err);
            }

            callback(null, {
                id: definition.id,
                index: definition.index,
                name: definition.label,
                label: definition.label,
                statisticType: definition.type,
                system: definition.system,
                systemName: definition.systemName,
                icon: definition.icon,
                gks: gks,
                titles: titles,
                sort: definition.sort,
                asc: false,
                type: 'site-statistic',
                readOnly: true,
                editable: false,
                count: gks.length,
                generated: new Date(),
                updated: new Date()
            });
        });
    };

    var BuildClientTitleMetadata = function(gk, row, callback) {

        var title = BuildFallbackTitleMetadata(gk, row);

        if (!CollectionsService.GetReleaseMetadata) {
            return callback(null, title);
        }

        CollectionsService.GetReleaseMetadata(gk, (err, releaseMetadata) => {
            if (err) {
                return callback(err);
            }

            if (releaseMetadata) {
                title.releaseSort = releaseMetadata.sort;
                title.releaseLabel = releaseMetadata.label;
            }

            callback(null, title);
        });
    };

    var BuildFallbackTitleMetadata = function(gk, row) {
        return {
            gk: gk,
            playCount: row.play_count || 0,
            lastPlayed: row.last_played || null,
            system: row.system_id || null,
            systemName: row.system_name || null
        };
    };

    var GetEnabledDefinitions = function() {

        var raw = GetRawConfig();
        var globalEnabled = true;
        var entries;
        var seen = {};
        var result = [];

        if (!raw) {
            return result;
        }

        if (Array.isArray(raw)) {
            entries = raw;
        }
        else {
            globalEnabled = raw.enabled !== false;
            entries = raw.collections || raw.definitions || raw.items || [];
        }

        if (!globalEnabled || !Array.isArray(entries)) {
            return result;
        }

        for (var i = 0, len = entries.length; i < len; ++i) {
            var definition = NormalizeDefinition(entries[i], i, raw);

            if (!definition || seen[definition.id]) {
                continue;
            }

            seen[definition.id] = true;
            definition.index = result.length;
            result.push(definition);
        }

        return result;
    };

    var NormalizeSelectionQuantity = function(value) {
        value = parseInt(value, 10);

        if (isNaN(value) || value < 1) {
            return 1;
        }

        return value;
    };

    var NormalizeDefinition = function(entry, index, rootConfig) {

        if (!entry || entry.enabled === false) {
            return null;
        }

        var type = NormalizeStatisticType(entry.type || entry.statisticType);
        if (!type) {
            console.log('Ignoring site statistic collection with unsupported type:', entry.type || entry.statisticType);
            return null;
        }

        var system = NormalizeSystem(entry.system || entry.systemId || entry.systemKey || null);
        var systemName = null;

        if (system) {
            if (!IsKnownLiveSystem(system)) {
                console.log('Ignoring site statistic collection with unknown or inactive system filter:', system);
                return null;
            }

            systemName = config.get('systems.' + system + '.name');
        }

        var id = NormalizeIdentifier(entry.id || BuildDefaultId(type, system, index));
        if (!id) {
            return null;
        }

        var defaults = _typeDefaults[type] || {};

        return {
            id: id,
            label: NormalizeLabel(entry.label || entry.name || defaults.label || id),
            type: type,
            enabled: true,
            system: system,
            systemName: systemName,
            limit: NormalizeLimit(entry.limit || (rootConfig && rootConfig.limit)),
            minPlayCount: NormalizeMinPlayCount(entry.minPlayCount || entry.minimumPlayCount || entry.min_play_count),
            refreshIntervalSeconds: NormalizeRefreshInterval(entry.refreshIntervalSeconds || entry.refreshSeconds || (rootConfig && rootConfig.refreshIntervalSeconds)),
            icon: NormalizeIcon(entry.icon || defaults.icon),
            sort: defaults.sort || null
        };
    };

    var GetRawConfig = function() {
        if (!config.has('siteStatisticCollections')) {
            return null;
        }

        return config.get('siteStatisticCollections');
    };

    var NormalizeStatisticType = function(value) {
        value = String(value || '').trim();

        if (_allowedTypes[value]) {
            return value;
        }

        return null;
    };

    var NormalizeIdentifier = function(value) {
        value = String(value || '').toLowerCase().trim();
        value = value.replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
        return value || null;
    };

    var NormalizeLabel = function(value) {
        value = String(value || '').replace(/\s+/g, ' ').trim();
        return value || 'Site Collection';
    };

    var NormalizeSystem = function(value) {
        value = String(value || '').trim();
        return value || null;
    };

    var NormalizeLimit = function(value) {
        value = parseInt(value, 10);

        if (isNaN(value) || value < 1) {
            return 12;
        }

        if (value > _maximumLimit) {
            return _maximumLimit;
        }

        return value;
    };

    var NormalizeMinPlayCount = function(value) {
        value = parseInt(value, 10);

        if (isNaN(value) || value < 1) {
            return 1;
        }

        return value;
    };

    var NormalizeRefreshInterval = function(value) {
        value = parseInt(value, 10);

        if (isNaN(value) || value < 1) {
            value = _defaultRefreshIntervalSeconds;
        }

        if (value < _minimumRefreshIntervalSeconds) {
            value = _minimumRefreshIntervalSeconds;
        }

        if (value > _maximumRefreshIntervalSeconds) {
            value = _maximumRefreshIntervalSeconds;
        }

        return value;
    };

    var NormalizeIcon = function(value) {
        value = String(value || '').trim();
        return value || '\u25c6';
    };

    var BuildDefaultId = function(type, system, index) {
        var id = type.replace(/[A-Z]/g, function(match) {
            return '-' + match.toLowerCase();
        });

        if (system) {
            id += '-' + system;
        }

        if (typeof index === 'number' && index > 0) {
            id += '-' + index;
        }

        return id;
    };

    var IsKnownLiveSystem = function(system) {
        if (!system || !config.has('systems.' + system)) {
            return false;
        }

        if (!config.has('systems.' + system + '.live') || !config.get('systems.' + system + '.live')) {
            return false;
        }

        return true;
    };

    var GetSharedRefreshIntervalSeconds = function(definitions) {

        definitions = definitions || GetEnabledDefinitions();

        var interval = _defaultRefreshIntervalSeconds;
        var raw = GetRawConfig();

        if (raw && !Array.isArray(raw) && raw.refreshIntervalSeconds) {
            interval = NormalizeRefreshInterval(raw.refreshIntervalSeconds);
        }

        for (var i = 0, len = definitions.length; i < len; ++i) {
            if (definitions[i].refreshIntervalSeconds && definitions[i].refreshIntervalSeconds < interval) {
                interval = definitions[i].refreshIntervalSeconds;
            }
        }

        return NormalizeRefreshInterval(interval);
    };

    var CloneCollections = function(collections) {
        var result = [];
        collections = Array.isArray(collections) ? collections : [];

        for (var i = 0, len = collections.length; i < len; ++i) {
            result.push(CloneCollection(collections[i]));
        }

        return result;
    };

    var CloneCollection = function(collection) {
        return {
            id: collection.id,
            index: collection.index,
            name: collection.name,
            label: collection.label,
            statisticType: collection.statisticType,
            system: collection.system,
            systemName: collection.systemName,
            icon: collection.icon,
            gks: CloneGameKeys(collection.gks),
            titles: CloneTitles(collection.titles),
            sort: collection.sort,
            asc: collection.asc,
            type: 'site-statistic',
            readOnly: true,
            editable: false,
            count: collection.count,
            generated: collection.generated,
            updated: collection.updated
        };
    };

    var CloneGameKeys = function(gks) {
        return Array.isArray(gks) ? gks.slice(0) : [];
    };

    var CloneTitles = function(titles) {
        var result = [];
        titles = Array.isArray(titles) ? titles : [];

        for (var i = 0, len = titles.length; i < len; ++i) {
            result.push({
                gk: titles[i].gk,
                releaseSort: titles[i].releaseSort,
                releaseLabel: titles[i].releaseLabel,
                playCount: titles[i].playCount || 0,
                lastPlayed: titles[i].lastPlayed || null,
                system: titles[i].system || null,
                systemName: titles[i].systemName || null
            });
        }

        return result;
    };
})();
