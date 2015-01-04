var db = require('./../db.js');
var resError = require('./messaging').resError;
var Q = require('q');
var Utils = require('./../utils');
var validator = require('validator');
var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10 /* work factor */);

exports.create = function(req, res){
	var email = req.body.email;
	var firstName = req.body.first_name;
	var lastName = req.body.last_name;
	var description = req.body.description;

	// Check that the provided information is valid.
	if (!validator.isEmail(email)){
		return resError(res, "Please enter a valid email address as your username.");
	} else if (!validator.isLength(firstName, 2, 128) || !validator.isLength(lastName, 2, 128)){
		return resError(res, "Sorry, your name is too short or too long.  " +
				"Do you have a nickname between 2 and 128 characters?");
	}

	// Hash the password.
	var passHash = bcrypt.hashSync(req.body.password, salt);

	// TODO(erik): Check that names are at least 2 letters long.  Return an error message if they
	// are not.
	var user = new db.models.User({
		username 			: validator.escape(email),
		firstName  			: validator.escape(firstName),
		lastName			: validator.escape(lastName),
		password			: passHash,
		joined  			: Date.now(),
		description			: validator.escape(description),
		photo				: req.body.photo,
	});

	user.save(function(err){
		if (err){
			resError(res, "Sorry, I could not create your account.  Try again later?");
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
	var queryRegex = new RegExp('^'+req.query.query, 'i');
	User.find({ username: queryRegex}, fields, function(err, docs, count){
		if (err){ console.log(err) };

		User.find({ firstName: queryRegex}, fields, function(err2, docs2, count){
			if (err2){ console.log(err2) };

			User.find({ lastName: queryRegex}, fields, function(err3, docs3, count){
				if (err3){ console.log(err3) };

				// Combine results and exclude the user's self from the search.
				var result = Utils.union(docs, docs2, docs3);
				if (req.user && req.user.username){
					result = result.filter(function (e){
						return e.username !== req.user.username;
					});
				}

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