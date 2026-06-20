const http = require('http');
const express = require('express');
const config = require('config');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const pg = require('pg');
const session = require('express-session');
const pgSession = require('connect-pg-simple-ces')(session);
const pool = require('./db/pool.js');
const ApplicationService = require('./services/application');
const UsersService = require('./services/users');
const SyncService = require('./services/sync');
const RedisCache = require('./services/cache/cache.redis.js');

const routes = require('./routes/index');
const saves = require('./routes/saves');
const savefiles = require('./routes/savefiles');
const suggest = require('./routes/suggest');
const dev = require('./routes/dev');
const media = require('./routes/media');
const games = require('./routes/games');
const collections = require('./routes/collections');
const featured = require('./routes/featured');
const shaders = require('./routes/shaders');

const app = express();

function GetConfigValue(name, defaultValue) {
    if (config.has(name)) {
        return config.get(name);
    }

    return defaultValue;
}

function GetFirstHeaderValue(value) {
    if (!value) {
        return '';
    }

    if (Array.isArray(value)) {
        value = value[0];
    }

    return String(value).split(',')[0].trim();
}

function NormalizeHostName(host) {
    host = GetFirstHeaderValue(host).toLowerCase();

    if (host.charAt(0) === '[') {
        var bracketIndex = host.indexOf(']');
        return bracketIndex >= 0 ? host.substring(0, bracketIndex + 1) : host;
    }

    return host.replace(/:\d+$/, '');
}

function IsSafeRedirectHost(host) {
    return !!host && /^[a-z0-9.\-:\[\]]+$/i.test(host);
}

function StripDefaultHttpPort(host) {
    return host.replace(/:80$/i, '');
}

function GetHttpsRedirectHost() {
    var configuredHost = NormalizeHostName(GetConfigValue('security.httpsRedirectHost', ''));

    if (!configuredHost || !IsSafeRedirectHost(configuredHost)) {
        return '';
    }

    return configuredHost;
}

function BuildHttpsRedirectHosts() {
    var configuredHosts = GetConfigValue('security.forceHttpsHosts', []);

    if (!Array.isArray(configuredHosts)) {
        configuredHosts = [configuredHosts];
    }

    return configuredHosts.map(function(host) {
        return NormalizeHostName(host);
    }).filter(function(host) {
        return !!host;
    });
}

function HostAllowsHttpsRedirect(host, allowedHosts) {
    if (!allowedHosts.length) {
        return true;
    }

    return allowedHosts.indexOf(NormalizeHostName(host)) >= 0;
}

function GetRequestHost(req) {
    return GetFirstHeaderValue(req.headers['x-forwarded-host']) || GetFirstHeaderValue(req.headers.host);
}

function GetHttpsRedirectStatus() {
    var configuredStatus = parseInt(GetConfigValue('security.httpsRedirectStatus', 308), 10);
    var allowedStatuses = [301, 302, 307, 308];

    if (allowedStatuses.indexOf(configuredStatus) >= 0) {
        return configuredStatus;
    }

    return 308;
}

function ForceHttps(allowedHosts, redirectStatus, redirectHost) {
    return function(req, res, next) {
        var host = GetRequestHost(req);

        if (req.secure || req.protocol === 'https') {
            return next();
        }

        if (!IsSafeRedirectHost(host) || !HostAllowsHttpsRedirect(host, allowedHosts)) {
            return next();
        }

        var targetHost = redirectHost || StripDefaultHttpPort(host);
        return res.redirect(redirectStatus, 'https://' + targetHost + req.originalUrl);
    };
}


function IsSaveFilesApiRequest(req) {
    return !!(req && req.originalUrl && req.originalUrl.indexOf('/savefiles') === 0);
}

function IsMissingSaveFilesSchemaError(err) {
    if (!err) {
        return false;
    }

    return err.code === '42P01' && String(err.message || '').indexOf('save_files') >= 0;
}

function GetApiErrorStatus(err) {
    var status = err && (err.status || err.statusCode);

    if (IsMissingSaveFilesSchemaError(err)) {
        return 503;
    }

    if (status && status >= 400 && status < 600) {
        return status;
    }

    if (typeof err === 'string') {
        return 400;
    }

    return 500;
}

function GetApiErrorMessage(err, status) {
    if (IsMissingSaveFilesSchemaError(err)) {
        return 'Normal save-file storage is not ready. Run the database migrations before using in-game save sync.';
    }

    if (status < 500) {
        if (typeof err === 'string') {
            return err;
        }

        if (err && err.message) {
            return err.message;
        }
    }

    return 'Normal save-file API request failed.';
}

function GetApiErrorCode(err) {
    if (IsMissingSaveFilesSchemaError(err)) {
        return 'save_files_schema_missing';
    }

    return err && err.safeCode ? err.safeCode : undefined;
}

var trustProxy = GetConfigValue('security.trustProxy', false);
var forceHttps = GetConfigValue('security.forceHttps', false);

if (trustProxy) {
    app.set('trust proxy', trustProxy);
}

if (forceHttps) {
    app.use(ForceHttps(BuildHttpsRedirectHosts(), GetHttpsRedirectStatus(), GetHttpsRedirectHost()));
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.text({limit: '50mb'}));
app.use(cookieParser());

//these folders will serve content statically
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'workspace')));

app.use(favicon(__dirname + '/public/favicon.ico'));

//set up sessions
var _pgStore = new pgSession({
    pool : pool,
    tableName : 'sessions',
    pruneSessionInterval: 60 * 13 //every 13 minutes (random but whatever)
});

var _session = session({
    secret: 'ill have what im having',
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000 //30 days
    },
    saveUninitialized: true, //this saves uninitiallized sessions making it so that simply visiting the site resets expiration
    resave: true, //Forces the session to be saved back to the session store, even if the session was never modified during the request.
    rolling: true, //Force a session identifier cookie to be set on every response. 
    store: _pgStore
});

app.use(_session);
app.use(UsersService.GetUserMiddleware); //attaches user to request
app.use(SyncService.Incoming); //syncs client to server

app.use('/', routes);
app.use('/saves', saves);
app.use('/savefiles', savefiles);
app.use('/suggest', suggest);
app.use('/games', games);
app.use('/collections', collections);
app.use('/shaders', shaders);
app.use('/featured', featured);

//end point only accessable in dev
if (app.get('env') === 'development') {
    app.use('/dev', dev);
    app.use('/media', media);
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//flush all redis cache. I have no reason for this data to persist between restarts of the app
//it is primarily used as a cache for all processes
var redis = new RedisCache();
redis.FlushAll();
redis = null;

//run on app start
ApplicationService.ApplicationStart(function(err) {
    if (err) {
        console.log('Error on start', err)
    }
});

// error handlers

app.use(function(err, req, res, next) {
    var status;
    var body;
    var safeCode;

    if (!IsSaveFilesApiRequest(req)) {
        return next(err);
    }

    if (res.headersSent) {
        return next(err);
    }

    status = GetApiErrorStatus(err);
    safeCode = GetApiErrorCode(err);
    body = {
        ok: false,
        error: GetApiErrorMessage(err, status)
    };

    if (safeCode) {
        body.code = safeCode;
    }

    console.log('Save-files API error for ' + req.method + ' ' + req.originalUrl + ':', err);
    res.status(status).json(body);
});

// development error handler
// will print stacktrace
//if (app.get('env') === 'development') {
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
});
//}

// production error handler
// no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//         message: err.message,
//         error: {}
//     });
// });

app.listen(3000, () => console.log('Crazyerics started and listening on port 3000'));

module.exports = app;
