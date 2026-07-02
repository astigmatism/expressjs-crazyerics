'use strict';

const express = require('express');
const multer = require('multer');
const url = require('url');
const Admin = require('../middleware/admin');

const router = express.Router();

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

router.all('/status', function(req, res) {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
});

router.all('/key', function(req, res) {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
});

router.all('/logout', function(req, res) {
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
