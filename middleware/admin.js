'use strict';

const crypto = require('crypto');
const config = require('config');

const DEFAULT_SESSION_SECRET = 'crazyerics-development-session-secret-change-me';
const LEGACY_SESSION_SECRET = 'ill have what im having';
const DEFAULT_MAX_KEY_BYTES = 4096;
const DEFAULT_MIN_KEY_BYTES = 24;
const DEFAULT_SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const DEFAULT_RATE_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_RATE_MAX_FAILURES = 6;
const DEFAULT_RATE_LOCKOUT_MS = 15 * 60 * 1000;

var _failureBuckets = {};

function GetConfigValue(name, defaultValue) {
    if (config.has(name)) {
        return config.get(name);
    }

    return defaultValue;
}

function GetStringConfig(name, defaultValue) {
    var value = GetConfigValue(name, defaultValue);

    if (value === null || typeof value === 'undefined') {
        return defaultValue;
    }

    return String(value);
}

function GetIntegerConfig(name, defaultValue, minValue, maxValue, envName) {
    var rawValue = typeof process.env[envName] !== 'undefined' ? process.env[envName] : GetConfigValue(name, defaultValue);
    var value = parseInt(rawValue, 10);

    if (isNaN(value)) {
        value = defaultValue;
    }

    if (typeof minValue === 'number' && value < minValue) {
        value = minValue;
    }

    if (typeof maxValue === 'number' && value > maxValue) {
        value = maxValue;
    }

    return value;
}

function GetBooleanConfig(name, defaultValue, envName) {
    var value = typeof process.env[envName] !== 'undefined' ? process.env[envName] : GetConfigValue(name, defaultValue);

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        value = value.toLowerCase().trim();
        return value === 'true' || value === '1' || value === 'yes' || value === 'on';
    }

    return !!value;
}

function NormalizeSha256Hex(value) {
    value = String(value || '').trim().toLowerCase();

    if (!value.match(/^[a-f0-9]{64}$/)) {
        return '';
    }

    return value;
}

function GetConfiguredAdminKeyHashHex() {
    return NormalizeSha256Hex(process.env.CRAZYERICS_ADMIN_KEY_SHA256 || GetStringConfig('security.adminKey.sha256', ''));
}

function GetExpectedAdminKeyHashBuffer() {
    var hex = GetConfiguredAdminKeyHashHex();

    if (!hex) {
        return null;
    }

    return Buffer.from(hex, 'hex');
}

function GetSessionSecretValue() {
    return String(process.env.CRAZYERICS_SESSION_SECRET || GetConfigValue('security.sessionSecret', '') || '');
}

function IsSessionSecretStrongEnoughForAdmin() {
    var secret = GetSessionSecretValue();

    return secret.length >= 32 && secret !== DEFAULT_SESSION_SECRET && secret !== LEGACY_SESSION_SECRET;
}

function IsAdminKeyAuthEnabledByConfig() {
    if (typeof process.env.CRAZYERICS_ADMIN_KEY_ENABLED !== 'undefined') {
        return GetBooleanFromString(process.env.CRAZYERICS_ADMIN_KEY_ENABLED);
    }

    return GetBooleanConfig('security.adminKey.enabled', false, 'CRAZYERICS_ADMIN_KEY_ENABLED');
}

function GetBooleanFromString(value) {
    value = String(value || '').toLowerCase().trim();
    return value === 'true' || value === '1' || value === 'yes' || value === 'on';
}

function IsAdminKeyAuthAvailable() {
    return IsAdminKeyAuthEnabledByConfig() && !!GetExpectedAdminKeyHashBuffer() && IsSessionSecretStrongEnoughForAdmin();
}

function GetMaxKeyBytes() {
    return GetIntegerConfig('security.adminKey.maxKeyBytes', DEFAULT_MAX_KEY_BYTES, 128, 64 * 1024, 'CRAZYERICS_ADMIN_KEY_MAX_BYTES');
}

function GetMinKeyBytes() {
    return GetIntegerConfig('security.adminKey.minKeyBytes', DEFAULT_MIN_KEY_BYTES, 1, GetMaxKeyBytes(), 'CRAZYERICS_ADMIN_KEY_MIN_BYTES');
}

function GetSessionTtlMs() {
    return GetIntegerConfig('security.adminKey.sessionTtlMs', DEFAULT_SESSION_TTL_MS, 5 * 60 * 1000, 24 * 60 * 60 * 1000, 'CRAZYERICS_ADMIN_SESSION_TTL_MS');
}

function GetRateWindowMs() {
    return GetIntegerConfig('security.adminKey.rateLimit.windowMs', DEFAULT_RATE_WINDOW_MS, 60 * 1000, 24 * 60 * 60 * 1000, 'CRAZYERICS_ADMIN_KEY_RATE_WINDOW_MS');
}

function GetRateMaxFailures() {
    return GetIntegerConfig('security.adminKey.rateLimit.maxFailures', DEFAULT_RATE_MAX_FAILURES, 1, 1000, 'CRAZYERICS_ADMIN_KEY_RATE_MAX_FAILURES');
}

function GetRateLockoutMs() {
    return GetIntegerConfig('security.adminKey.rateLimit.lockoutMs', DEFAULT_RATE_LOCKOUT_MS, 60 * 1000, 24 * 60 * 60 * 1000, 'CRAZYERICS_ADMIN_KEY_RATE_LOCKOUT_MS');
}

function GetClientIdentifier(req) {
    return (req.ip || (req.connection && req.connection.remoteAddress) || 'unknown').toString();
}

function CleanupFailureBuckets(now) {
    Object.keys(_failureBuckets).forEach(function(key) {
        var bucket = _failureBuckets[key];

        if (!bucket || (bucket.lockedUntil || 0) < now && (bucket.windowStartedAt || 0) + GetRateWindowMs() < now) {
            delete _failureBuckets[key];
        }
    });
}

function GetFailureBucket(req, now) {
    var key = GetClientIdentifier(req);
    var bucket = _failureBuckets[key];

    if (!bucket) {
        bucket = {
            failures: 0,
            windowStartedAt: now,
            lockedUntil: 0
        };
        _failureBuckets[key] = bucket;
    }

    if (bucket.windowStartedAt + GetRateWindowMs() < now && bucket.lockedUntil < now) {
        bucket.failures = 0;
        bucket.windowStartedAt = now;
        bucket.lockedUntil = 0;
    }

    return bucket;
}

function CheckRateLimit(req) {
    var now = Date.now();
    var bucket;

    CleanupFailureBuckets(now);
    bucket = GetFailureBucket(req, now);

    if (bucket.lockedUntil && bucket.lockedUntil > now) {
        return {
            allowed: false,
            retryAfterMs: bucket.lockedUntil - now
        };
    }

    return {
        allowed: true,
        retryAfterMs: 0
    };
}

function RecordFailure(req, reason) {
    var now = Date.now();
    var bucket = GetFailureBucket(req, now);

    bucket.failures += 1;

    if (bucket.failures >= GetRateMaxFailures()) {
        bucket.lockedUntil = now + GetRateLockoutMs();
    }

    LogAttempt(req, 'failure', reason || 'invalid', bucket);
}

function RecordSuccess(req) {
    delete _failureBuckets[GetClientIdentifier(req)];
    LogAttempt(req, 'success', 'accepted');
}

function LogAttempt(req, result, reason, bucket) {
    var message = 'Admin key authentication ' + result + ' from ' + GetClientIdentifier(req) + ' reason=' + reason;

    if (bucket && bucket.lockedUntil && bucket.lockedUntil > Date.now()) {
        message += ' lockedUntil=' + new Date(bucket.lockedUntil).toISOString();
    }

    console.log(message);
}

function IsAdminSessionActive(req) {
    var admin = req.session && req.session.admin;
    var expiresAt;

    if (!admin || admin.authenticated !== true) {
        return false;
    }

    expiresAt = parseInt(admin.expiresAt, 10);

    if (!expiresAt || expiresAt <= Date.now()) {
        ClearAdminSession(req);
        return false;
    }

    return true;
}

function GetAdminPublicState(req) {
    var admin = req.session && req.session.admin;

    if (!IsAdminSessionActive(req)) {
        return {
            active: false
        };
    }

    return {
        active: true,
        expiresAt: new Date(parseInt(admin.expiresAt, 10)).toISOString()
    };
}

function AttachAdminState(req, res, next) {
    req.admin = GetAdminPublicState(req);
    req.isAdmin = req.admin.active;

    if (res && res.locals) {
        res.locals.admin = req.admin;
    }

    next();
}

function CreateAdminSession(req, callback) {
    var now = Date.now();
    var ttl = GetSessionTtlMs();

    req.session.admin = {
        authenticated: true,
        method: 'file-key',
        authenticatedAt: now,
        expiresAt: now + ttl
    };

    if (typeof req.session.save === 'function') {
        return req.session.save(callback);
    }

    callback();
}

function ClearAdminSession(req, callback) {
    if (req && req.session && req.session.admin) {
        delete req.session.admin;
    }

    if (callback && req && req.session && typeof req.session.save === 'function') {
        return req.session.save(callback);
    }

    if (callback) {
        callback();
    }
}

function AuthenticateKeyBuffer(buffer) {
    var expected;
    var actual;

    if (!IsAdminKeyAuthAvailable()) {
        return false;
    }

    if (!Buffer.isBuffer(buffer) || buffer.length < GetMinKeyBytes() || buffer.length > GetMaxKeyBytes()) {
        return false;
    }

    expected = GetExpectedAdminKeyHashBuffer();
    actual = crypto.createHash('sha256').update(buffer).digest();

    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function RequireAdmin(req, res, next) {
    if (IsAdminSessionActive(req)) {
        return next();
    }

    return res.status(403).json({
        ok: false,
        error: 'Administrator authorization is required.'
    });
}

module.exports = {
    DEFAULT_SESSION_SECRET: DEFAULT_SESSION_SECRET,
    LEGACY_SESSION_SECRET: LEGACY_SESSION_SECRET,
    AttachAdminState: AttachAdminState,
    RequireAdmin: RequireAdmin,
    IsAdminSessionActive: IsAdminSessionActive,
    GetAdminPublicState: GetAdminPublicState,
    CreateAdminSession: CreateAdminSession,
    ClearAdminSession: ClearAdminSession,
    AuthenticateKeyBuffer: AuthenticateKeyBuffer,
    CheckRateLimit: CheckRateLimit,
    RecordFailure: RecordFailure,
    RecordSuccess: RecordSuccess,
    IsAdminKeyAuthAvailable: IsAdminKeyAuthAvailable,
    IsSessionSecretStrongEnoughForAdmin: IsSessionSecretStrongEnoughForAdmin,
    GetMaxKeyBytes: GetMaxKeyBytes
};
