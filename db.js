/**
 * Golden Data.
 * 
 * This file sets up our server's connection to our data storage. The Mongoose library is used to
 * connect to our database hosted on MongoLab. If it cannot connect, it should default to a local
 * storage scheme. This file also describes the schema, outlining the format of our user and message
 * information.
 */

var mongoose = require('mongoose');
var secret = require('./appconfig');
var dbName = 'goldenconversations';

// Message Schema
var Schema = mongoose.Schema;
var Message = new Schema({
    name : String,
    content  : String,
    created  : Date
}, { collection: 'public' });

mongoose.model('Message', Message, 'public');
 
// Connect to database and listen to events.
mongoose.connect('mongodb://'+secret.userDecipher.decipher() + ':' +
		secret.passDecipher.decipher() +
		'@ds061208.mongolab.com:61208/'+dbName);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
	console.log("MongoDB connection opened to database: " + dbName);
});

// Export the db andschema to external interfaces
exports.db = db;
exports.Message = Message;