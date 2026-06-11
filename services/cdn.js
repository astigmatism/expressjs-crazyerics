'use strict';
const config = require('config');
const async = require('async');
const node_ssh = require('node-ssh');
const NodeSSH = node_ssh.NodeSSH || node_ssh;

module.exports = new (function() {

    var _self = this;

    this.UploadFile = function(localPath, remotePath, callback) {

        //for each cdn
        async.eachSeries(config.cdn, (cdn, nextcdn) => {

            var ssh = new NodeSSH();
            ssh.connect({
                host: cdn.host,
                username: cdn.user,
                privateKeyPath: process.env.HOME + '/.ssh/id_rsa'
            })
            .then(() => {
                var destination = cdn.root + remotePath; //no file escape, ssh.putFile does this

                ssh.putFile(localPath, destination).then(() => {

                    nextcdn();

                }, (err) => {
                    return nextcdn(err);
                });
            });
        }, (err) => {
            if (err) return callback(err);
    
            return callback();
        });
    };

    this.DeleteFolders = function(remotePaths, callback) {

        if (typeof remotePaths === 'string') {
            remotePaths = [remotePaths];
        }

        //for each folder
        async.eachSeries(remotePaths, (remotePath, nextRemotePath) => {

            //for each cdn
            async.eachSeries(config.cdn, (cdn, nextcdn) => {

                var ssh = new NodeSSH();
                ssh.connect({
                    host: cdn.host,
                    username: cdn.user,
                    privateKeyPath: process.env.HOME + '/.ssh/id_rsa'
                })
                .then(() => {
                    //delete old processed file
                    var removecmd = 'rm -rf "' + cdn.root + remotePath + '"'; //as this is a straight up cli cmd, use quotes
                    ssh.execCommand(removecmd).then((result) => {
                        if (result.stderr) return callback(result.stderr);
                        
                        nextcdn();
                    });
                });

            }, (err) => {
                if (err) return callback(err);

                nextRemotePath();
            });
        }, (err) => {
            if (err) return callback(err);

            return callback();
        });
    };
})();