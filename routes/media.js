var express = require('express');
var router = express.Router();
var config = require('config');
var FileService = require('../services/files.js');
var multer  = require('multer');
var upload = multer( { dest: '../uploads/' } );
var CdnService = require('../services/cdn.js');
const fs = require('fs-extra');

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

router.post('/video', upload.single( 'file' ), function(req, res, next) {

    var filepath = req.body.filepath;

    CdnService.UploadFile(req.file.path, '/media' + filepath + '/0.mp4', (err) => {
        if (err) return res.status(500).end(err);

        var data = {
            'originalfile': req.body.filename,
            'dateprocessed': Date.now(),
            'notes': req.body.notes
        };

        var temp = './temp/temp.json';

        FileService.WriteJson(temp, data, (err) => {
            if (err) return res.status(500).end(err);

            CdnService.UploadFile(temp, '/media' + filepath + '/info.json', (err) => {
                if (err) return res.status(500).end(err);

                FileService.DeleteFile(temp, err => {
                    if (err) return res.status(500).end(err);
    
                    res.status(200).end();
                });
            });
        });
    });
});

//form upload
router.post('/metadata', (req, res, next) => {

    var data = JSON.parse(req.body.data);
    var filepath = req.body.filepath;

    //if an empty object, just delete the file from the cdn
    if (data && Object.keys(data).length === 0) {

        CdnService.DeleteFolders('/media' + filepath, (err) => {
            if (err) return res.status(500).end(err);
            res.status(200).end();
        });
        return;
    }

    var temp = './temp/temp.json';

    FileService.WriteJson(temp, data, (err) => {
        if (err) return res.status(500).end(err);

        CdnService.UploadFile(temp, '/media' + filepath + '/0.json', (err) => {
            if (err) return res.status(500).end(err);

            FileService.DeleteFile(temp, err => {
                if (err) return res.status(500).end(err);

                res.status(200).end();
            });
        });
    });
});

//file update of metadata
router.post('/metadata/file', upload.single( 'file' ), function(req, res, next) {

    var filepath = req.body.filepath;
    var system = req.body.system;
    var title = req.body.title;
    var emumoviestitletranslationfilepath = '/data/' + system + '_emumoviestitles';

    //let's save the association between the emumovies title name and our title name, 
    //we could use it later
    FileService.Get(emumoviestitletranslationfilepath, (err, data) => {
        if (err) {
            data = {};
        }
        data[title] = req.file.originalname;

        FileService.Set(emumoviestitletranslationfilepath, data, err => {
            if (err) return callback(err);

            CdnService.UploadFile(req.file.path, '/media' + filepath + '/0.json', (err) => {
                if (err) return res.status(500).end(err);
                res.status(200).end();
            });

        }, true);
    });
});

router.delete('/', function(req, res, next) {

    var root = req.body.root;
    var filepath = req.body.filepath;

    if (!root) {
        return res.status(400).end('err 0'); //400 Bad Request
    }

    CdnService.DeleteFolders([root + filepath, '/processed' + filepath], (err) => {
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