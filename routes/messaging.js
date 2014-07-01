
/*
 * Messaging functions.
 */

var mongoose = require('mongoose');
var Message = mongoose.model('Message');
var validator = require('validator');

// sends response with an error message, and logs it in the console
function resError(res, message){
	console.error(message);
	res.send({status: message, success: false});
}

// gets messages - /all
exports.getMessage = function(req, res){
	// find all messages
    Message.find({}, function (err, messages, count){
    	if (err){
			resError(res, "Could not find messages collection in DB.");
		}

    	res.send(messages);
    });
};


// adds a new message - /post
exports.addMessage = function(req, res){
	// validate comment info
	var name = req.body.name;
	var content = req.body.content;

	if (typeof name === 'undefined' || typeof content === 'undefined'){
		resError(res, "Missing data parameters (name, content)");
	}
	cname = validator.toString(name);
	ccontent = validator.toString(content);

	var validName = validator.isLength(cname, 1, 140) && (validator.isNull(cname) == false);
	var validContent = validator.isLength(ccontent, 1, 512) && (validator.isNull(ccontent) == false);

	if (validName == false){
		resError(res, "Invalid name");
	} else if (validContent == false){
		resError(res, "Invalid content");
	} else {
		// make and save the message
		var m = new Message({
			name : validator.escape(cname),
			content : validator.escape(ccontent),
			created : Date.now()
		});
		m.save(function(err, message){
			if (err){
				resError(res, "Could not save message into db.");
			} else {
				res.send({status: 'OK', success: true});
			}
		});
	}
};
