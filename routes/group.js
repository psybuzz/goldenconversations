var db = require('./../db.js');
var resError = require('./messaging').resError;
var Utils = require('./../utils');

exports.create = function(req, res){
	var group = new db.models.Group({
	    members             : req.body.groupMaker,
	    name                : req.body.name,
	});

	group.save(function(err){
		if (err){
			console.log(err);
		} else{
			res.send({status: 'OK', success: true});
		}
	});
};

exports.delete = function(req, res){
	Group.findByIdAndRemove(req.body.objectId, function(err){
		if (err) return console.log(err);
	});
};

exports.update = function(req, res){
	Group.findByIdAndUpdate(req.body.objectId, req.body.updata, function(err){
		if (err) return console.log(err);
	});
};