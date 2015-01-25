var db = require('./../db.js');
var validator = require('validator');
var resError = require('./messaging').resError;
var validator = require('validator');
var Mailman = require('./../mailman.js').Mailman;
var User = db.models.User;

// sends response with an error message, and logs it in the console
function resError(res, message){
	console.error(message);
	res.send({status: message, success: false});
}

exports.create = function(req, res){
	if (!req.user || !req.user._id){
		return resError(res, "Sorry, it looks like you're not logged in!");
	}

	// Create a new post using the provided request data.
	var postOptions = {
		user: req.user,
		content: req.body.content,
		conversationId: req.body.conversationId
	};
	createPost(postOptions, function (){
		res.send({status: 'OK', success: true});
	}, function (err){
		resError(res, err);
	});
};

/**
 * Creates a new post for a specified conversation, alerting participants via 
 * email.
 * 
 * @param  {Function} onSuccess The success callback.
 * @param  {Function} onFailure The failure callback.
 * @param  {Object} options   	The configuration options.
 *      @param {UserSchema} user 	The user creating the post.
 *      @param {String} content 	The post's string content.
 *      @param {id} conversationId 	The associated conversation id.
 */
function createPost(options, onSuccess, onFailure){
	// validate comment info
	var user = options.user;
	var name = user.firstName+' '+user.lastName;
	var userId = user._id;
	var content = validator.escape(options.content);
	var conversationId = options.conversationId;
	onSuccess = onSuccess || function (){};
	onFailure = onFailure || function (){};

	// Check that required parameters are met.
	if (typeof user === "undefined" || typeof content === "undefined" ||
				typeof conversationId === "undefined"){
		return onFailure("Missing data parameters (name, content)");
	} else if (!validator.isLength(content, 140, 10000) || validator.isNull(content)){
		return onFailure("Please make sure your content is at least 140 characters.");
	}

	// Replace the newlines in the user's post with break tags in order to save the message 
	// properly. This will allow us to display the post properly when the conversation page is 
	// loaded again in situations where the user uses newlines in their post (such as when creating 
	// lists or when creating spacing between typed paragraph). Note that we also need to replace 
	// newlines with break tags in the display screen immediately after the user hits 'Send' on 
	// their post. This is acheived by performing the same logic on the value of the text field when 
	// #mainform is submited.
	content = content.replace(/(?:\r\n|\r|\n)/g, '<br />');

	// Create and save the post. Note that the 'username' for a post is really 
	// the pretty name formed from the user's first and last name.
	var post = new db.models.Post({
	    username	: name,
	    userid		: userId,
	    content  	: content,
	    time  		: Date.now()
	});
	post.save(function(err, message){
		if (err){
			return onFailure("Could not save message into db.");
		}

		// Add the post to the conversation's discussion and save
		Conversation.findOne( { _id: conversationId }, function (err, convo, count){
			if (err || !convo){
				return onFailure("Could not find messages collection in DB.");
			}

			convo.discussion.push(post._id);
			convo.save(function(err, message){
				if (err){
					onFailure("Could not save message into db.");
				} else {
					onSuccess();
				}
			});

			// Try to send emails to participants.
			var participantIds = convo.participants.map(function (user){
				return user._id;
			});
			var promise = User.find({ _id: { $in: participantIds }}).exec();
			promise.then(function (participants){
				var currentUser = participants.filter(function (user){
					return user._id.toString() === userId;
				})[0];
				var emails = participants.map(function (user){return user.username});
				var subject = 'GC: ' + currentUser.firstName + ' responded to the question: ' + convo.question;
				if (subject.length > 70){
					subject = subject.slice(0, 70) + '...';
				}
				var contentSnippet = content.slice(0, 140) + '...';

				Mailman.sendMail({
					recipients: emails,
					subject: subject,
					html: 'Hello,<br><br>In a follow-up to the conversation<br><h3>' +
						convo.question + '</h3>' + currentUser.firstName +
						' added: ' + contentSnippet + '<br>' +
						'<br>Continue the conversation on <a href="http://goldenconversations.heroku.com/">Golden Conversations</a>.',
					callback: function(){
						console.log('New conversation notification emails have been sent.');
					}
				});
			});
	    });
	});
}
exports.createPost = createPost;

exports.delete = function(req, res){
	Post.findByIdAndRemove(req.body.objectId, function(err){
		if (err) return console.log(err);
	});
};

exports.update = function(req, res){
	Post.findByIdAndUpdate(req.body.objectId, req.body.updata, function(err){
		if (err) return console.log(err);
	});
};