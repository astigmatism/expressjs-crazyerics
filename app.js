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
const suggest = require('./routes/suggest');
const dev = require('./routes/dev');
const media = require('./routes/media');
const games = require('./routes/games');
const collections = require('./routes/collections');
const featured = require('./routes/featured');

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

function ForceHttps(allowedHosts, redirectStatus) {
    return function(req, res, next) {
        var host = GetRequestHost(req);

        if (req.secure || req.protocol === 'https') {
            return next();
        }

        if (!IsSafeRedirectHost(host) || !HostAllowsHttpsRedirect(host, allowedHosts)) {
            return next();
        }

        return res.redirect(redirectStatus, 'https://' + StripDefaultHttpPort(host) + req.originalUrl);
    };
}

var trustProxy = GetConfigValue('security.trustProxy', false);
var forceHttps = GetConfigValue('security.forceHttps', false);

if (trustProxy) {
    app.set('trust proxy', trustProxy);
}

if (forceHttps) {
    app.use(ForceHttps(BuildHttpsRedirectHosts(), GetHttpsRedirectStatus()));
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
app.use('/suggest', suggest);
app.use('/games', games);
app.use('/collections', collections);
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
