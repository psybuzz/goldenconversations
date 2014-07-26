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
var ObjectId = mongoose.Schema.Types.ObjectId;

// Post Schema
var postSchema = new Schema({
    username	: String,
    userid      : String,
    content  	: String,
    time  		: Date
}, { collection: 'post' });

// User Schema
// Whenever a user updates their name, we need to update their listed name in the 'participants'
// field in all of their conversations.
var userSchema = new Schema({
    username 			: String,
    firstName  			: String,
    lastName            : String,
    joined  			: Date,
    description			: String,
    photo				: String,
    userConversations	: [{ conversation: ObjectId, hallOfFame: Boolean }],
    groups              : [ObjectId],
    recentContacts		: [ObjectId],
    password            : String
}, { collection: 'user' });

// Conversation Schema
var conversationSchema = new Schema({
    invited             : [ObjectId],
    participants        : [{ user: ObjectId, firstName: String, lastName: String, isThrilled: Boolean }],
    category            : String,
    question            : String,
    discussion          : [ObjectId],
    isGroup             : Boolean,
    lastEdited          : Date
}, { collection: 'conversation' });

// Groups Schema
var groupSchema = new Schema({
    invited             : [ObjectId],
    members             : [ObjectId],
    name                : String,
    conversations       : [ObjectId]
}, { collection: 'group' });

var dbModels = {
	'Post': mongoose.model('Post', postSchema, 'post'),
	'User': mongoose.model('User', userSchema, 'user'),
	'Conversation': mongoose.model('Conversation', conversationSchema, 'conversation'),
	'Group': mongoose.model('Group', groupSchema, 'group')
}

exports.models = dbModels;
 
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