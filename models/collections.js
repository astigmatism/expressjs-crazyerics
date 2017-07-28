var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var collectionsSchema = new Schema({
	userId: String,
	created: { type: Date, default: Date.now },
    title: String,
    games: [{
        key: String,
        lastPlayed: { type: Date, default: Date.now },
        played: {type: Number, default: 0 }
    }]
});

// the schema is useless so far
// we need to create a model using it
var Collection = mongoose.model('Collection', collectionsSchema);

// make this available to our users in our Node applications
module.exports = Collection;