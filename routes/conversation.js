var db = require('./../db.js');
var Q = require('q');

Conversation = db.models.Conversation;
Post = db.models.Post;

exports.create = function(req, res){
	var conversation = new db.models.Conversation({
	    participants        : req.body.iceBreaker,
	    category            : req.body.category,
	    question            : req.body.question,
	    isGroup             : req.body.isGroup,
	    lastEdited          : Date.now()
	});

	console.log(req.body.question);

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

exports.getTestMessages = function(req, res){
	// find all messages
    Conversation.find( { question:"What is the best fruit in the world?" }, function (err, messages, count){
    	if (err){
			resError(res, "Could not find messages collection in DB.");
		}

		var results = [];
		if (messages[0]){
			console.log("messages[0]", messages[0]);
			var jobs = messages[0].discussion.map(function(postId, index){
				console.log("index is", index);
				var d = Q.defer();
				console.log("index is", index);
					console.log("postId", postId);
					Post.find({ _id: postId }, function(err, post){
						if (err){
							d.reject();
						}
						results[index] = post[0];
						console.log("results in find is", results);
						d.resolve(post);
					});
				return d.promise;
			});
			console.log("jobs", jobs);
			Q.allSettled(jobs).then(function (){
				console.log("results is", results);
	    		res.send(results);	
			})
		}
    });
};