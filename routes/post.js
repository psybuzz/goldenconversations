var db = require('./../db.js');
var validator = require('validator');
var resError = require('./messaging').resError;

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
		// Create and save the post
		var post = new db.models.Post({
		    username	: req.body.username,
		    content  	: req.body.content,
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