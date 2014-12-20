var db = require('./../db.js');
var resError = require('./messaging').resError;
var Q = require('q');
var Utils = require('./../utils');
var validator = require('validator');
var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10 /* work factor */);

exports.create = function(req, res){
	// Hash the password.
	var passHash = bcrypt.hashSync(req.body.password, salt);

	// TODO(erik): Check that names are at least 2 letters long.  Return an error message if they
	// are not.
	var user = new db.models.User({
		username 			: validator.escape(req.body.email),
		firstName  			: validator.escape(req.body.first_name),
		lastName			: validator.escape(req.body.last_name),
		password			: passHash,
		joined  			: Date.now(),
		description			: validator.escape(req.body.description),
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