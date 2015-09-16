// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var guestSchema = new Schema({
    ipaddress: String,
    games: [{
        title: String,
        system: String,
        file: String,
        states: [ Array ]
        screens: [ Array ]
    }],
    created: Date,
    lastlogin: Date
});

// the schema is useless so far
// we need to create a model using it
var Guest = mongoose.model('Guest', guestSchema);

// make this available to our users in our Node applications
module.exports = Guest;