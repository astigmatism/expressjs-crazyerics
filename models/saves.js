var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var savesSchema = new Schema({
	sessionId: String,
	timeStamp: Number,
	gameKey: String,
	state: String,
	screen: String,
	type: String
});

// the schema is useless so far
// we need to create a model using it
var Save = mongoose.model('Save', savesSchema);

// make this available to our users in our Node applications
module.exports = Save;