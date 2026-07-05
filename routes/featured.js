'use strict';

var express = require('express');
var router = express.Router();
var UtilitiesService = require('../services/utilities.js');
var FeaturedService = require('../services/featured.js');
var CollectionsService = require('../services/collections.js');
var Admin = require('../middleware/admin');

function SendCompressedJson(res, payload) {
    res.json(UtilitiesService.Compress.json(payload || {}));
}


function IsMissingFeaturedSchemaError(err) {
    var message = String(err && err.message || '');

    return err && err.code === '42P01' && message.indexOf('featured_collections') >= 0;
}

function SendJsonError(res, status, message) {
    res.status(status || 400).json({
        ok: false,
        error: message || 'Featured collection request failed.'
    });
}

function HandleApiError(req, res, err, status) {
    console.log('Featured collection API error for ' + req.method + ' ' + req.originalUrl + ':', err && err.message ? err.message : err);

    if (IsMissingFeaturedSchemaError(err)) {
        return SendJsonError(res, 503, 'Featured collection storage is not ready. Run the featured collections database migration before using this feature.');
    }

    SendJsonError(res, status || (typeof err === 'string' ? 400 : 500), typeof err === 'string' ? err : 'Featured collection request failed.');
}

function DecodeCollectionIdFromBody(req) {
    var rawCollectionId = req.body && (req.body.c || req.body.collectionId);

    if (!rawCollectionId) {
        return null;
    }

    if (String(rawCollectionId).match(/^\d+$/)) {
        return parseInt(rawCollectionId, 10);
    }

    return CollectionsService.DecodeClientCollectionId(rawCollectionId);
}

function GetSortStateFromBody(req) {
    var body = req.body || {};
    var sortState = body.sortState || {};

    if (body.sort || typeof body.asc !== 'undefined') {
        sortState = {
            sort: body.sort || sortState.sort,
            asc: typeof body.asc !== 'undefined' ? body.asc : sortState.asc
        };
    }

    return sortState;
}

function GetFeaturedCollectionId(req) {
    var id = req.params && req.params.id ? req.params.id : req.query && req.query.id;

    id = parseInt(id, 10);

    if (isNaN(id) || id < 1) {
        return null;
    }

    return id;
}

// Request one featured collection. With ?i=, this preserves the old "next featured" behavior.
// Without ?i=, it returns one random collection for the current page/request.
router.get('/', function(req, res) {

    var hasIndex = typeof req.query.i !== 'undefined';
    var index = parseInt(req.query.i, 10);

    if (hasIndex && !isNaN(index)) {
        return FeaturedService.GetNext(index + 1, 1, (err, result) => {
            if (err) { return HandleApiError(req, res, err); }
            SendCompressedJson(res, result || []);
        });
    }

    FeaturedService.GetRandom(1, (err, result) => {
        if (err) { return HandleApiError(req, res, err); }
        SendCompressedJson(res, result || []);
    });
});

// Publish the signed-in admin's selected personal collection as a server-persisted featured collection.
router.post('/publish', Admin.RequireAdmin, function(req, res) {

    var collectionId;

    try {
        collectionId = DecodeCollectionIdFromBody(req);
    }
    catch (err) {
        return SendJsonError(res, 400, 'The featured publish request did not contain a valid collection id.');
    }

    if (!req.user || !collectionId) {
        return SendJsonError(res, 400, 'Missing collection information.');
    }

    FeaturedService.PublishUserCollection(req.user.user_id, collectionId, req.body && req.body.gks, GetSortStateFromBody(req), (err, collection, action) => {
        if (err) { return HandleApiError(req, res, err); }

        SendCompressedJson(res, {
            ok: true,
            action: action,
            collection: collection,
            _c: {
                f: collection ? [collection] : []
            }
        });
    });
});

// Admin direct-create helper retained for older tooling, now protected by server admin mode.
router.post('/', Admin.RequireAdmin, function(req, res) {

    var name = req.body && req.body.name;
    var gks = req.body && req.body.gks;
    
    FeaturedService.Create(name, gks, GetSortStateFromBody(req), (err, collection, action) => {
        if (err) { return HandleApiError(req, res, err); }

        SendCompressedJson(res, {
            ok: true,
            action: action,
            collection: collection,
            _c: {
                f: collection ? [collection] : []
            }
        });
    });
});

function DeleteFeaturedCollection(req, res) {

    var featuredCollectionId = GetFeaturedCollectionId(req);

    if (!featuredCollectionId) {
        return SendJsonError(res, 400, 'Missing featured collection id.');
    }

    FeaturedService.Delete(featuredCollectionId, (err, deletedCollection) => {
        if (err) { return HandleApiError(req, res, err); }

        FeaturedService.GetRandom(1, (err, nextSelection) => {
            if (err) { return HandleApiError(req, res, err); }

            SendCompressedJson(res, {
                ok: true,
                deleted: deletedCollection,
                _c: {
                    f: nextSelection || []
                }
            });
        });
    });
}

router.delete('/', Admin.RequireAdmin, DeleteFeaturedCollection);
router.delete('/:id', Admin.RequireAdmin, DeleteFeaturedCollection);

module.exports = router;
