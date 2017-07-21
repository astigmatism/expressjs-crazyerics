var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var gamesSchema = new Schema({
	key: String,
	system: String,
	title: String,
    files: {type: Object, default: {}}
});

// the schema is useless so far
// we need to create a model using it
var Game = mongoose.model('Game', gamesSchema);

// make this available to our users in our Node applications
module.exports = Game;