'use strict';

var express = require('express');
var router = express.Router();
var UtilitiesService = require('../services/utilities.js');
var SiteStatisticCollectionsService = require('../services/site-statistic-collections.js');

function SendCompressedJson(res, payload) {
    res.json(UtilitiesService.Compress.json(payload || {}));
}

function SendJsonError(res, status, message) {
    res.status(status || 400).json({
        ok: false,
        error: message || 'Site statistic collection request failed.'
    });
}

function IsMissingStatisticSchemaError(err) {
    var message = String(err && err.message || '');

    return err && err.code === '42P01' && (message.indexOf('files') >= 0 || message.indexOf('titles') >= 0 || message.indexOf('systems') >= 0);
}

function HandleApiError(req, res, err, status) {
    console.log('Site statistic collection API error for ' + req.method + ' ' + req.originalUrl + ':', err && err.message ? err.message : err);

    if (IsMissingStatisticSchemaError(err)) {
        return SendJsonError(res, 503, 'Site statistic collection source tables are not ready. Ensure the Crazyerics title and file tables exist before using this feature.');
    }

    SendJsonError(res, status || (typeof err === 'string' ? 400 : 500), typeof err === 'string' ? err : 'Site statistic collection request failed.');
}

router.get('/', function(req, res) {
    SiteStatisticCollectionsService.GetAllCached(function(err, payload) {
        if (err) { return HandleApiError(req, res, err); }
        SendCompressedJson(res, payload || { collections: [] });
    });
});

router.get('/:id', function(req, res) {
    SiteStatisticCollectionsService.GetPayloadById(req.params.id, function(err, payload) {
        if (err) { return HandleApiError(req, res, err); }
        SendCompressedJson(res, payload || { collections: [] });
    });
});

module.exports = router;
