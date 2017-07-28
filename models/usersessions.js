//the linking table for sessions mapping to users

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var userSessionsSchema = new Schema({
    userId: String,
    sessionId: String,
    lastActivity: { type: Date, default: Date.now }
});

// the schema is useless so far
// we need to create a model using it
var UserSession = mongoose.model('UserSession', userSessionsSchema);

// make this available to our users in our Node applications
module.exports = UserSession;