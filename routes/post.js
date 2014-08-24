var db = require('./../db.js');
var validator = require('validator');
var resError = require('./messaging').resError;
var Utils = require('./../utils');
var validator = require('validator');

// sends response with an error message, and logs it in the console
function resError(res, message){
	console.error(message);
	res.send({status: message, success: false});
}

exports.create = function(req, res){
	// validate comment info
	var name = req.user.username;
	var content = validator.escape(req.body.content);

	if (typeof name === 'undefined' || typeof content === 'undefined'){
		resError(res, "Missing data parameters (name, content)");
	}

	var validContent = validator.isLength(content, 140, 10000) && (validator.isNull(content) == false);
	if (validContent == false){
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