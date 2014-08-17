var db = require('./../db.js');
var validator = require('validator');
var resError = require('./messaging').resError;
var Mailman = require('./../mailman.js').Mailman;

User = db.models.User;

// sends response with an error message, and logs it in the console
function resError(res, message){
	console.error(message);
	res.send({status: message, success: false});
}

exports.create = function(req, res){
	// validate comment info
	var name = req.body.username;
	var content = req.body.content;

	if (typeof name === 'undefined' || typeof content === 'undefined'){
		resError(res, "Missing data parameters (name, content)");
	}

	var cname = validator.toString(name);
	content = validator.toString(content);
	var validName = validator.isLength(cname, 1, 140) && (validator.isNull(cname) == false);
	var validContent = validator.isLength(content, 140, 10000) && (validator.isNull(content) == false);
	if (validName == false){
		resError(res, "Invalid name");
	} else if (validContent == false){
		resError(res, "Invalid content");
	} else {
		// Replace the newlines in the user's post with break tags in order to save the message properly.
		// This will allow us to display the post properly when the conversation page is loaded again in situations
		// where the user uses newlines in their post (such as when creating lists or when creating spacing between
		// typed paragraph). Note that we also need to replace newlines with break tags in the display screen
		// immediately after the user hits 'Send' on their post. This is acheived by performing the same logic
		// on the value of the text field when #mainform is submited.
		content = content.replace(/(?:\r\n|\r|\n)/g, '<br />');

		// Create and save the post
		var post = new db.models.Post({
		    username	: req.body.username,
		    userid		: req.body.userId,
		    content  	: content,
		    time  		: Date.now()
		});
		post.save(function(err, message){
			if (err){
				resError(res, "Could not save message into db.");
			} else {
				// Add the post to the conversation's discussion and save
			    Conversation.findOne( { _id: req.body.conversationId }, function (err, convo, count){
			    	if (err){
						resError(res, "Could not find messages collection in DB.");
					}
					else{
						convo.discussion.push(post._id);
				    	convo.save(function(err, message){
				    		if (err){
								resError(res, "Could not save message into db.");
							} else {
								res.send({status: 'OK', success: true});
							}
						});

						// Try to send emails to participants.
						var participantIds = convo.participants.map(function (user){
							return user._id;
						});
						var promise = User.find({ _id: { $in: participantIds }}).exec();
						promise.then(function (participants){
							var currentUser = participants.filter(function (user){
								return user._id.toString() === req.body.userId;
							})[0];
							var emails = participants.map(function (user){return user.username});
							var subject = 'GC: ' + currentUser.firstName + ' responded to the question: ' + convo.question;
							if (subject.length > 70){
								subject = subject.slice(0, 70) + '...';
							}
							var contentSnippet = content.slice(0, 140) + '...';

							// TODO(erik): Sanitize the question by escaping HTML entities.
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
					}
			    });
			}
		});
	}
};

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