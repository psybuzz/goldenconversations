var db = require('./../db.js');
var resError = require('./messaging').resError;
var Q = require('q');
var Utils = require('./../utils');

exports.create = function(req, res){
	// Escape the request body for security.
	Utils.escape(req.body);

	// TODO(erik): Check that names are at least 2 letters long.  Return an error message if they
	// are not.
	var user = new db.models.User({
		username 			: req.body.email,
	    firstName  			: req.body.first_name,
	    lastName			: req.body.last_name,
	    password			: req.body.password,
	    joined  			: Date.now(),
	    description			: req.body.description,
	    photo				: req.body.photo,
	});

	user.save(function(err){
		if (err){
			console.log(err);
		} else{
			res.send({status: 'OK', success: true, redirect: '/'});
		}
	});
};

exports.delete = function(req, res){
	User.findByIdAndRemove(req.body.objectId, function(err){
		if (err) return console.log(err);
	});
};

exports.update = function(req, res){
	// Escape the request body for security.
	Utils.escape(req.body);

	User.findByIdAndUpdate(req.body.objectId, req.body.updata, function(err){
		if (err) return console.log(err);
	});
};

exports.search = function(req, res){
	var fields = 'username firstName lastName';

	User.find({ username: new RegExp('^'+req.query.query, 'i')}, fields, function(err, docs, count){
		if (err){ console.log(err) };


		User.find({ firstName: new RegExp('^'+req.query.query, 'i')}, fields, function(err2, docs2, count){
			if (err2){ console.log(err2) };

			User.find({ lastName: new RegExp('^'+req.query.query, 'i')}, fields, function(err3, docs3, count){
				if (err3){ console.log(err3) };

				var result = Utils.union(docs, docs2, docs3);
				res.send({status: 'OK', success: true, message: result});
			});
		});
	});
};

exports.findById = function(id) {
	var d = Q.defer();
	User.findById(id, function(err, user){
		if (err){
			resError("internal", "Could not find user by id");
			d.reject();
			return;
		}
		d.resolve(user);
	});
	return d.promise;
}