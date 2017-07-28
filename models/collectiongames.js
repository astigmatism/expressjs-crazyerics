//games are mapped to collections

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var collectionGamesSchema = new Schema({
    collectionId: String,
    gameKey: String,
    lastPlayed: { type: Date, default: Date.now },
    playCount: { type: Number, default: 0 }
});

// the schema is useless so far
// we need to create a model using it
var CollectionGames = mongoose.model('CollectionGames', collectionGamesSchema);

// make this available to our users in our Node applications
module.exports = CollectionGames;