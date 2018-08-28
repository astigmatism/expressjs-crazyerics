var express = require('express');
var router = express.Router();
var config = require('config');
var FileService = require('../services/files.js');
var multer  = require('multer');
var upload = multer( { dest: '../uploads/' } );
var scp = require('scp2');
var exec = require('ssh-exec');
var async = require('async');

router.post('/', upload.single( 'file' ), function(req, res, next) {

	var system = req.body.system;
	var title = req.body.title;
	var filepath = req.body.filepath;

    //for each cdn
    async.eachSeries(config.cdn, (cdn, nextcdn) => {

        var sshConnection = cdn.user + '@' + cdn.host;
        scp.scp(req.file.path,  sshConnection + ':' + cdn.root + '/media' + filepath + '/0.jpg', function(err) {
            if (err) return nextcdn(err);

            //delete processed image
            exec('rm -R ' + cdn.root + '/processed' + filepath, sshConnection, function (err, stdout, stderr) {
                if (err) return nextcdn(err);

                return nextcdn();
            });
        });

    }, (err) => {
        if (err) return res.status(500).end('err 1');

        res.status(200).end();
    });
});

router.get('/:system/:alpha?', function(req, res, next) {

    var system = req.params.system;
    var alpha = req.params.alpha;

    if (!system) {
        return res.status(400).end('err 0'); //400 Bad Request
    }

    FileService.Get('/data/' + system + '_master', (err, masterFile) => {
        if (err) return res.status(500).json(err);

        //filter out everything except
        if (alpha) {

            var temp = {};
            var regex = new RegExp('^' + alpha + '.*', 'i');

            //if alpha, find alpha, otherwise show all non alpha
            if (!alpha.match(/^[A-Z]/i)) {
                regex = new RegExp('^[^A-Z].*', 'i');
            }

            Object.keys(masterFile).forEach(function(key) {

                if (key.match(regex)) {
                    temp[key] = masterFile[key];
                }
            });
            masterFile = temp;
        }

        res.render('mediabrowser', {
            masterFile: JSON.stringify(masterFile),
            system: system,
            paths: JSON.stringify(config.paths)
        });
    });
});

module.exports = router;