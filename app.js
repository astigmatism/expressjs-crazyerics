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
const pgSession = require('connect-pg-simple-crazyerics')(session);
const pool = require('./db/pool.js');
const ApplicationService = require('./services/application');
const UsersService = require('./services/users');

const routes = require('./routes/index');
const saves = require('./routes/saves');
const suggest = require('./routes/suggest');
const work = require('./routes/work');
const games = require('./routes/games');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.text({limit: '50mb'}));
app.use(cookieParser());

//these folders will serve content statically
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'workspace')));

app.use(favicon(__dirname + '/public/favicon.ico'));

//set up sessions
var pgStore = new pgSession({
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
    store: pgStore
});

app.use(_session);
app.use(UsersService.GetUserFromCache); //user details middleware

app.use('/', routes);
app.use('/saves', saves);
app.use('/suggest', suggest);
app.use('/games', games);


if (app.get('env') === 'development') {
    app.use('/work', work);
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//run on app start
ApplicationService.ApplicationStart(function() {
    
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
