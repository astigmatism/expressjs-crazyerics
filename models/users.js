var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var usersSchema = new Schema({
    username: String,
    email: String,
    created: { type: Date, default: Date.now }
});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', usersSchema);

// make this available to our users in our Node applications
module.exports = User;