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

var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.ObjectId;

// Post Schema
var postSchema = new Schema({
    username	: String,
    content  	: String,
    time  		: Date
}, { collection: 'public' });

// User Schema
var userSchema = new Schema({
    username 			: String,
    name  				: String,
    login  				: String,
    joined  			: Date,
    description			: String,
    photo				: String,
    userConversations	: [{ conversation: ObjectId, hallOfFame: boolean }],
    recentContacts		: String,

}, { collection: 'public' });

// Conversation Schema
var conversationSchema = new Schema({
    user : String,
    content  : String,
    time  : Date
}, { collection: 'public' });

// Groups Schema
var groupSchema = new Schema({
    user : String,
    content  : String,
    time  : Date
}, { collection: 'public' });

var dbModels = {
	'Post': mongoose.model('Post', postSchema, 'public'),
	'User': mongoose.model('Post', postSchema, 'public'),
	'Conversation': mongoose.model('Post', postSchema, 'public'),
	'Group': mongoose.model('Post', postSchema, 'public'),
 
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