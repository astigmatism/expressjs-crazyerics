var express = require('express');
var router = express.Router();
var config = require('config');
var FileService = require('../services/files.js');
var multer  = require('multer');
var upload = multer( { dest: '../uploads/' } );
var CdnService = require('../services/cdn.js');

router.post('/', upload.single( 'file' ), function(req, res, next) {

	var filepath = req.body.filepath;

    CdnService.UploadFile(req.file.path, '/media' + filepath + '/0.jpg', (err) => {
        if (err) return res.status(500).end(err);

        CdnService.DeleteFolders('/processed' + filepath, (err) => {
            if (err) return res.status(500).end(err);
            
            res.status(200).end();
        });
    });
});

router.delete('/', function(req, res, next) {

    var filepath = req.body.filepath;

    CdnService.DeleteFolders(['/media' + filepath, '/processed' + filepath], (err) => {
        if (err) return res.status(500).end(err);
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