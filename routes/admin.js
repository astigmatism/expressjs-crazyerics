'use strict';

const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const url = require('url');
const Admin = require('../middleware/admin');
const FeaturedService = require('../services/featured');

const router = express.Router();

const MASTER_INVENTORY_FILENAME = 'master-inventory.tsv';
const MASTER_INVENTORY_PATH = path.resolve(__dirname, '..', MASTER_INVENTORY_FILENAME);
const MASTER_INVENTORY_DOWNLOAD_URL = '/admin/featured-collections/master-inventory.tsv';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: 1,
        fields: 1,
        fileSize: Admin.GetMaxKeyBytes(),
        parts: 2
    },
    fileFilter: function(req, file, callback) {
        if (!file || file.fieldname !== 'adminKey') {
            return callback(new Error('Unexpected admin key file field.'));
        }

        callback(null, true);
    }
});

function JsonFailure(res, status) {
    return res.status(status || 401).json({
        ok: false,
        error: 'Admin key was not accepted.'
    });
}

function JsonNotAvailable(res) {
    return res.status(404).json({
        ok: false,
        error: 'Admin key authentication is not available.'
    });
}

function IsMultipartFormRequest(req) {
    var contentType = String(req.headers['content-type'] || '').toLowerCase();
    return contentType.indexOf('multipart/form-data') === 0;
}

function FirstHeaderValue(value) {
    if (!value) {
        return '';
    }

    if (Array.isArray(value)) {
        value = value[0];
    }

    return String(value).split(',')[0].trim();
}

function NormalizeHost(value) {
    return FirstHeaderValue(value).toLowerCase();
}

function GetRequestHost(req) {
    return FirstHeaderValue(req.headers['x-forwarded-host']) || FirstHeaderValue(req.headers.host);
}

function OriginMatchesRequestHost(req, source) {
    var parsed;

    if (!source) {
        return true;
    }

    parsed = url.parse(source);

    if (!parsed || !parsed.host) {
        return false;
    }

    return NormalizeHost(parsed.host) === NormalizeHost(GetRequestHost(req));
}


function RequireAjaxRequest(req, res, next) {
    if (String(req.headers['x-requested-with'] || '').toLowerCase() !== 'xmlhttprequest') {
        return JsonFailure(res, 403);
    }

    next();
}

function RequireSameOriginWhenPresent(req, res, next) {
    var origin = FirstHeaderValue(req.headers.origin);
    var referer = FirstHeaderValue(req.headers.referer);

    if (origin && !OriginMatchesRequestHost(req, origin)) {
        Admin.RecordFailure(req, 'cross_origin');
        return JsonFailure(res, 403);
    }

    if (!origin && referer && !OriginMatchesRequestHost(req, referer)) {
        Admin.RecordFailure(req, 'cross_origin_referer');
        return JsonFailure(res, 403);
    }

    next();
}

function RequireAdminKeyAvailable(req, res, next) {
    if (!Admin.IsAdminKeyAuthAvailable()) {
        console.log('Admin key authentication request rejected because admin key auth is disabled or incompletely configured.');
        return JsonNotAvailable(res);
    }

    next();
}

function RequireRateLimit(req, res, next) {
    var rate = Admin.CheckRateLimit(req);

    if (!rate.allowed) {
        res.set('Retry-After', String(Math.ceil(rate.retryAfterMs / 1000)));
        return JsonFailure(res, 429);
    }

    next();
}

function RequireMultipart(req, res, next) {
    if (!IsMultipartFormRequest(req)) {
        Admin.RecordFailure(req, 'bad_content_type');
        return JsonFailure(res, 400);
    }

    next();
}

function ParseAdminKeyUpload(req, res, next) {
    upload.single('adminKey')(req, res, function(err) {
        if (err) {
            Admin.RecordFailure(req, err.code || 'upload_rejected');
            return JsonFailure(res, err.code === 'LIMIT_FILE_SIZE' ? 413 : 400);
        }

        next();
    });
}

function IsMissingFeaturedSchemaError(err) {
    var message = String(err && err.message || '');

    return err && ((err.code === '42P01' && message.indexOf('featured_collections') >= 0) || (err.code === '42703' && (message.indexOf('tags') >= 0 || message.indexOf('priority') >= 0)));
}

function SendFeaturedManagementError(req, res, err, status) {
    var responseStatus = status || 500;
    var body = {
        ok: false,
        error: 'Featured collection management request failed.'
    };

    if (IsMissingFeaturedSchemaError(err)) {
        responseStatus = 503;
        body.error = 'Featured collection storage is not ready. Run the featured collections database migration before using this feature.';
    }
    else if (typeof err === 'string') {
        responseStatus = status || 400;
        body.error = err;
    }
    else if (err && err.isValidation) {
        responseStatus = status || 400;
        body.error = err.message || body.error;
        if (err.details) {
            body.details = err.details;
        }
    }
    else if (err && err.status && err.status >= 400 && err.status < 500) {
        responseStatus = err.status;
        body.error = err.message || body.error;
    }

    console.log('Featured management API error for ' + req.method + ' ' + req.originalUrl + ':', err && err.message ? err.message : err);
    res.status(responseStatus).json(body);
}

function SendFeaturedManagementPayload(res, payload) {
    payload = payload || {};
    payload.ok = true;
    res.json(payload);
}

function GetImportText(body) {
    body = body || {};
    return body.importText || body.csv || body.details || body.games || '';
}

function GetSortStateFromBody(body) {
    body = body || {};

    var sort = typeof body.sortField !== 'undefined' ? body.sortField : body.sort;
    var asc = typeof body.asc !== 'undefined' ? body.asc : undefined;

    if (typeof body.sortDirection !== 'undefined') {
        asc = String(body.sortDirection).toLowerCase() !== 'desc';
    }

    return {
        sort: sort,
        asc: asc
    };
}

function GetActiveStateFromBody(body, defaultValue) {
    body = body || {};

    if (typeof body.active !== 'undefined') {
        return body.active;
    }

    if (typeof body.published !== 'undefined') {
        return body.published;
    }

    if (typeof body.hidden !== 'undefined') {
        return !(body.hidden === true || body.hidden === 'true' || body.hidden === '1' || body.hidden === 1 || body.hidden === 'hidden');
    }

    return defaultValue;
}

function GetMasterInventoryInfo() {
    var info = {
        filename: MASTER_INVENTORY_FILENAME,
        downloadUrl: MASTER_INVENTORY_DOWNLOAD_URL,
        available: false
    };
    var stats;

    try {
        stats = fs.statSync(MASTER_INVENTORY_PATH);
        if (stats && stats.isFile()) {
            info.available = true;
            info.size = stats.size;
            info.updated = stats.mtime ? stats.mtime.toISOString() : null;
        }
    }
    catch (err) {
        if (err && err.code !== 'ENOENT') {
            console.log('Unable to inspect master inventory file:', err.message || err);
        }
    }

    return info;
}

function SendMasterInventoryDownload(req, res) {
    fs.stat(MASTER_INVENTORY_PATH, function(err, stats) {
        if (err || !stats || !stats.isFile()) {
            if (!err || err.code === 'ENOENT') {
                return res.status(404).json({
                    ok: false,
                    error: 'Master inventory file is not available. Confirm application startup generated master-inventory.tsv at the project root.'
                });
            }

            console.log('Master inventory download failed for ' + req.originalUrl + ':', err && err.message ? err.message : err);
            return res.status(500).json({
                ok: false,
                error: 'Master inventory download failed.'
            });
        }

        res.set('Cache-Control', 'private, no-store');
        res.set('Content-Type', 'text/tab-separated-values; charset=utf-8');
        res.set('Content-Disposition', 'attachment; filename="' + MASTER_INVENTORY_FILENAME + '"');
        res.set('X-Content-Type-Options', 'nosniff');
        res.sendFile(MASTER_INVENTORY_PATH, function(downloadErr) {
            if (!downloadErr) {
                return;
            }

            console.log('Master inventory download error for ' + req.originalUrl + ':', downloadErr && downloadErr.message ? downloadErr.message : downloadErr);
            if (!res.headersSent) {
                res.status(500).json({
                    ok: false,
                    error: 'Master inventory download failed.'
                });
            }
        });
    });
}

router.get('/status', function(req, res) {
    res.json({
        ok: true,
        admin: Admin.GetAdminPublicState(req)
    });
});

router.post('/key', RequireAdminKeyAvailable, RequireRateLimit, RequireAjaxRequest, RequireSameOriginWhenPresent, RequireMultipart, ParseAdminKeyUpload, function(req, res, next) {
    if (!req.file || !Buffer.isBuffer(req.file.buffer)) {
        Admin.RecordFailure(req, 'missing_file');
        return JsonFailure(res, 400);
    }

    if (!Admin.AuthenticateKeyBuffer(req.file.buffer)) {
        Admin.RecordFailure(req, 'invalid_key');
        return JsonFailure(res, 401);
    }

    Admin.RecordSuccess(req);
    Admin.CreateAdminSession(req, function(err) {
        if (err) {
            return next(err);
        }

        res.json({
            ok: true,
            admin: Admin.GetAdminPublicState(req)
        });
    });
});

router.post('/logout', RequireAjaxRequest, RequireSameOriginWhenPresent, function(req, res, next) {
    Admin.ClearAdminSession(req, function(err) {
        if (err) {
            return next(err);
        }

        res.json({
            ok: true,
            admin: Admin.GetAdminPublicState(req)
        });
    });
});

router.get('/featured-collections', Admin.RequireAdmin, function(req, res) {
    FeaturedService.GetManagementList((err, collections) => {
        if (err) { return SendFeaturedManagementError(req, res, err); }

        SendFeaturedManagementPayload(res, {
            collections: collections || [],
            sortFields: FeaturedService.GetSortFieldOptions(),
            sortDirections: [
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' }
            ],
            metadata: FeaturedService.GetMetadataOptions(),
            import: FeaturedService.GetImportSettings(),
            masterInventory: GetMasterInventoryInfo()
        });
    });
});


router.get('/featured-collections/master-inventory.tsv', Admin.RequireAdmin, RequireSameOriginWhenPresent, function(req, res) {
    SendMasterInventoryDownload(req, res);
});

router.post('/featured-collections/parse-preview', Admin.RequireAdmin, RequireSameOriginWhenPresent, function(req, res) {
    FeaturedService.PreviewImport(GetImportText(req.body), (err, importResult) => {
        if (err) { return SendFeaturedManagementError(req, res, err); }

        SendFeaturedManagementPayload(res, {
            importResult: importResult
        });
    });
});

router.post('/featured-collections', Admin.RequireAdmin, RequireSameOriginWhenPresent, function(req, res) {
    var body = req.body || {};

    FeaturedService.CreateFromImport(body.name || body.title, GetImportText(body), GetSortStateFromBody(body), GetActiveStateFromBody(body, true), {
        tags: body.tags,
        priority: body.priority
    }, (err, collection, action, importResult) => {
        if (err) { return SendFeaturedManagementError(req, res, err); }

        SendFeaturedManagementPayload(res, {
            action: action,
            collection: collection,
            importResult: importResult
        });
    });
});

router.patch('/featured-collections/:id', Admin.RequireAdmin, RequireSameOriginWhenPresent, function(req, res) {
    FeaturedService.UpdateManagement(req.params.id, req.body || {}, (err, collection, action) => {
        if (err) { return SendFeaturedManagementError(req, res, err); }

        SendFeaturedManagementPayload(res, {
            action: action,
            collection: collection
        });
    });
});

router.post('/featured-collections/:id/hide', Admin.RequireAdmin, RequireSameOriginWhenPresent, function(req, res) {
    FeaturedService.SetActive(req.params.id, false, (err, collection, action) => {
        if (err) { return SendFeaturedManagementError(req, res, err); }

        SendFeaturedManagementPayload(res, {
            action: action,
            collection: collection
        });
    });
});

router.post('/featured-collections/:id/show', Admin.RequireAdmin, RequireSameOriginWhenPresent, function(req, res) {
    FeaturedService.SetActive(req.params.id, true, (err, collection, action) => {
        if (err) { return SendFeaturedManagementError(req, res, err); }

        SendFeaturedManagementPayload(res, {
            action: action,
            collection: collection
        });
    });
});

router.delete('/featured-collections/:id', Admin.RequireAdmin, RequireSameOriginWhenPresent, function(req, res) {
    FeaturedService.Delete(req.params.id, (err, deletedCollection) => {
        if (err) { return SendFeaturedManagementError(req, res, err); }

        SendFeaturedManagementPayload(res, {
            deleted: deletedCollection
        });
    });
});

router.all('/status', function(req, res) {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
});

router.all('/key', function(req, res) {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
});

router.all('/logout', function(req, res) {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
});

router.all('/featured-collections*', function(req, res) {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
});

router.use(function(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    console.log('Admin key API error for ' + req.method + ' ' + req.originalUrl + ':', err && err.message ? err.message : err);
    res.status(500).json({
        ok: false,
        error: 'Admin key request failed.'
    });
});

module.exports = router;
