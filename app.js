var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var mongoose = require('mongoose');
var session = require('express-session');
var UtilitiesService = require('./services/utilities');
var MongoStore = require('connect-mongo')(session);

// var Dropbox = require('dropbox');
// var config = require('config');
// var dbx = new Dropbox({ 
//     accessToken: config.get('dropboxaccesstoken')
// });
// dbx.filesListFolder({path: ''})
//           .then(function(response) {
//             console.log(response);
//           })
//           .catch(function(error) {
//             console.log(error);
//           });

mongoose.connect('mongodb://localhost/crazyerics');

var routes = require('./routes/index');
var states = require('./routes/states');
var suggest = require('./routes/suggest');
var work = require('./routes/work');

var app = express();

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

app.use(session({
    secret: 'ill have what im having',
    cookie: {
        maxAge: 1209600000 //two weeks
    },
    saveUninitialized: true, //this saves uninitiallized sessions making it so that simply visiting the site resets expiration
    resave: true, //Forces the session to be saved back to the session store, even if the session was never modified during the request.
    rolling: true, //Force a session identifier cookie to be set on every response. 
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    })
}));

app.use('/', routes);
app.use('/states', states);
app.use('/suggest', suggest);

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
UtilitiesService.onApplicationStart(function() {
    
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
