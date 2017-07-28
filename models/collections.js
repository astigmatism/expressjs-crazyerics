var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var collectionsSchema = new Schema({
	sessionId: String,
	dateCreated: Number,
    gameKeys: Array,
    title: String
});

// the schema is useless so far
// we need to create a model using it
var Collection = mongoose.model('Collection', collectionsSchema);

// make this available to our users in our Node applications
module.exports = Collection;