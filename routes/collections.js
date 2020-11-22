'use strict';
const express = require('express');
const router = express.Router();
const config = require('config');
const GamesService = require('../services/games');
const CollectionsService = require('../services/collections');
const UtilitiesService = require('../services/utilities');
const SyncService = require('../services/sync');
const UserService = require('../services/users');

//gets collection (also sets that collection to active)
router.get('/', function(req, res, next) {

    var clientCollectionId = decodeURIComponent(req.query.c);
    var collectionId;

    //sanitize expected values
    try {
        collectionId = CollectionsService.DecodeClientCollectionId(clientCollectionId);
    }
    catch (e) {
        return next('The server failed to parse required post data or query strings.');
    }
    
    if (req.user && collectionId) {

        var userId = req.user.user_id;

        CollectionsService.SetActiveCollection(userId, collectionId, (err, result) => {
            if (err) return next(err);

            SyncService.Outgoing({}, userId, null, (err, compressedResult) => {
                if (err) return res.json(err);

                res.json(compressedResult);
            });
        });
    }
    else {
        return next('Missing input parameters');
    }
});

//creates collection
router.post('/', function(req, res, next) {
    
    var name = req.body.name; //the name entered by the user (sanitized at client)

    if (req.user && name && name !== '' && name !== '!') {
        
        var userId = req.user.user_id;

        CollectionsService.CreateCollection(userId, name, (err, createResult) => {
            if (err) return next(err);

            SyncService.Outgoing({}, userId, null, (err, compressedResult) => {
                if (err) return res.json(err);
                
                res.json(compressedResult);
            });
        }, true); //true say to make it active
    }
    else {
        return next('Missing input parameters');
    }
});

//renames collection
router.post('/rename', function(req, res, next) {
    
    var name = req.body.name;                                 //the name entered by the user (sanitized at client)
    var clientCollectionId = decodeURIComponent(req.body.c); //this will be populated with the name of the current collection wished to take on the new name
    var collectionId;

    //sanitize expected values
    try {
        collectionId = CollectionsService.DecodeClientCollectionId(clientCollectionId);
    }
    catch (e) {
        return next('The server failed to parse required post data or query strings.');
    }

    if (req.user && collectionId && name && name !== '' && name !== '!') {
        
        var userId = req.user.user_id;

        CollectionsService.RenameCollection(userId, collectionId, name, (err, result) => {
            if (err) return next(err);

            SyncService.Outgoing({}, userId, null, (err, compressedResult) => {
                if (err) return res.json(err);
                
                res.json(compressedResult);
            });
        }, false); //this flag to make the collection active, not needed yet?
    }
    else {
        return next('Missing input parameters');
    }
});

//put's title into current collection 
router.put('/', function(req, res, next) {
    var gk = decodeURIComponent(req.query.gk);
    var gameKey = null;                 //of type GameKey (see utilities)

    //sanitize expected values
    try {
        gameKey = UtilitiesService.Decompress.gamekey(gk); //extract values
    }
    catch (e) {
        return next('The server failed to parse required post data or query strings.');
    }

    if (req.user && req.session && gameKey) {

        var userId = req.user.user_id;        

        //ensure a record of this game exists in the db (since I dynmically add them when consumed)
        GamesService.EnhancedGameKey(gameKey, function(err, eGameKey) {
            if (err) return next(err);

            UserService.AddTitle(userId, eGameKey, (err, userTitleRecord) => {
                if (err) return next(err);

                //add to active collection, if already there, no problem
                CollectionsService.AddTitle(userId, eGameKey, (err, addTitleResult) => {
                    if (err) return next(err);
                    
                    SyncService.Outgoing({}, userId, eGameKey, (err, compressedResult) => {
                        if (err) return res.json(err);
                        
                        res.json(compressedResult);
                    });
                });
            });
        });
    }
    else {
        return next('No user or session on request');
    }
});

//delete collection
router.delete('/', function(req, res, next) {

    var clientCollectionId = decodeURIComponent(req.query.c);
    var collectionId;
    
    //sanitize expected values
    try {
        collectionId = CollectionsService.DecodeClientCollectionId(clientCollectionId);
    }
    catch (e) {
        return next('The server failed to parse required post data or query strings.');
    }

    if (req.user && collectionId) {

        var userId = req.user.user_id;

        CollectionsService.DeleteCollection(userId, collectionId, (err, deleteRecord) => {
            if (err) return next(err);

            SyncService.Outgoing({}, userId, null, (err, compressedResult) => {
                if (err) return res.json(err);
                
                res.json(compressedResult);
            });

        });
    }
    else {
        return next('Missing input parameters');
    }
});

//delete game from active collection
router.delete('/game', function(req, res, next) {

    //before we can delete, ensure all the following
    var gk = decodeURIComponent(req.query.gk);
    var gameKey;

    //sanitize expected values
    try {
        gameKey = UtilitiesService.Decompress.gamekey(gk); //extract values
    }
    catch (e) {
        return next('The server failed to parse required post data or query strings.');
    }

    if (req.user && req.session && gameKey) {

        var userId = req.user.user_id;

        GamesService.EnhancedGameKey(gameKey, (err, eGameKey) => {
            if (err) { return next(err); }

            //the service will get the active collection for this user
            CollectionsService.DeleteCollectionTitle(userId, eGameKey, (err) => {
                if (err) { return next(err); }
                
                SyncService.Outgoing({}, userId, eGameKey, (err, compressedResult) => {
                    if (err) { return res.json(err); }
                    res.json(compressedResult);
                });
            });
        });
    }
    else {
        return next('Missing input parameters');
    }
});

router.post('/makefeature', function(req, res, next) {
    
    var env = process.env.NODE_ENV;
    var sort = req.body.sort;
    var asc = req.body.asc;

    if (env !== 'production' && req.user && sort && asc) {
        
        var userId = req.user.user_id;

        CollectionsService.MakeFeaturedCollection(userId, sort, asc, (err) => {
            if (err) {
                return next(err);
            }
            res.json();
        })
    }
    else {
        return next('Missing input parameters');
    }
});

module.exports = router;