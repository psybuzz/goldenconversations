var db = require('./../db.js');

exports.create = function(req, res){
	var post = new db.models.Post({
	    username	: req.body.username,
	    content  	: req.body.content,
	    time  		: Date.now()
	});

	post.save(function(err){
		if (err){
			console.log(err);
		} else{
			res.send({status: 'OK', success: true});
		}
	});
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