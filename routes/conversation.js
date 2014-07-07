var db = require('./../db.js');

exports.create = function(req, res){
	var conversation = new db.models.Conversation({
	    participants        : req.body.iceBreaker,
	    category            : req.body.category,
	    question            : req.body.question,
	    isGroup             : req.body.isGroup,
	    lastEdited          : Date.now()
	});

	conversation.save(function(err){
		if (err){
			console.log(err);
		} else{
			res.send({status: 'OK', success: true});
		}
	});
};

exports.delete = function(req, res){
	Conversation.findByIdAndRemove(req.body.objectId, function(err){
		if (err) return console.log(err);
	});
};

exports.update = function(req, res){
	Conversation.findByIdAndUpdate(req.body.objectId, req.body.updata, function(err){
		if (err) return console.log(err);
	});
};