var db = require('./../db.js');

exports.create = function(req, res){
	var user = new db.models.User({
		username 			: req.body.username,
	    name  				: req.body.name,
	    joined  			: Date.now(),
	    description			: req.body.description,
	    photo				: req.body.photo,
	});

	user.save(function(err){
		if (err){
			console.log(err);
		} else{
			res.send({status: 'OK', success: true});
		}
	});
};

exports.delete = function(req, res){
	User.findByIdAndRemove(req.body.objectId, function(err){
		if (err) return console.log(err);
	});
};

exports.update = function(req, res){
	User.findByIdAndUpdate(req.body.objectId, req.body.updata, function(err){
		if (err) return console.log(err);
	});
};

exports.search = function(req, res){
	User.find({ username: req.body.username}, function(err, docs, count){
		if (err){
			console.log(err);
		}
		res.send(docs);
	});
};