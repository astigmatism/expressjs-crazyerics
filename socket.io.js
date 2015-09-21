var http = require('http');
var express = require('express');
var io = require('socket.io')(http);

io.on('connection', function (socket) {
    
    socket.on('start', function (name, callback) {
        callback('woot');
    });

    socket.on('disconnect', function () {
        io.emit('user disconnected');
    });
});

module.exports = io;