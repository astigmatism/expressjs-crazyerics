var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var userSessionsSchema = new Schema({
    userid: String,
    sessionid: String
});

// the schema is useless so far
// we need to create a model using it
var UserSession = mongoose.model('UserSession', userSessionsSchema);

// make this available to our users in our Node applications
module.exports = UserSession;