var db = require('./../db.js');
var Q = require('q');
var resError = require('./messaging').resError;
var findUserById = require('./user').findById;

Conversation = db.models.Conversation;
User = db.models.User;
Post = db.models.Post;

exports.create = function(req, res){
	var iceBreakerId = req.body.iceBreaker;

	User.findById(iceBreakerId, function (err, user){
    	if (err) resError(res, "Could not find user.");

    	/*
		* people should be passed as an array:
		* [{user: id}, {user: id2}, ...]
		*/
		// TODO: User.findById and fill in the firstName, lastName for each person in people array.
		var people = req.body.people || [];
		people = people.concat([{
			user: iceBreakerId,
			firstName: user.firstName, 
			lastName: user.lastName
		}]);
		for (var i = 0; i < people.length; i++) {
			people[i].isThrilled = false;
		};

		var conversation = new db.models.Conversation({
		    participants        : people,
		    category            : req.body.category,
		    question            : req.body.question,
		    isGroup             : req.body.isGroup,
		    lastEdited          : Date.now()
		});

		conversation.save(function(err){
			if (err) resError(res, err);

			var jobs = people.map(function(person, index){
				var d = Q.defer();
				User.findById(person.user, function(err, user){
					if (err) d.reject();

					// TODO: Check that we aren't pushing in a duplicate conversation.
					user.userConversations.push({conversation: conversation.id, hallOfFame: false});
					user.save(function(err){
						if (err) d.reject();
						
						d.resolve();	
					});
				});
				return d.promise;
			});
			Q.allSettled(jobs).then(function (){
				console.log(people)
	    		res.send({status: 'OK', success: true, redirect: '/conversation/'+conversation._id});	
			});
		});
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
    Conversation.find( { question:"What does 'je ne sais quoi?' mean?" }, function (err, messages, count){
    	if (err){
			resError(res, "Could not find messages collection in DB.");
		}

		var results = [];
		if (messages[0]){
			var jobs = messages[0].discussion.map(function(postId, index){
				var d = Q.defer();
					Post.find({ _id: postId }, function(err, post){
						if (err){
							d.reject();
						}
						results[index] = post[0];
						d.resolve(post);
					});
				return d.promise;
			});
			Q.allSettled(jobs).then(function (){
	    		res.send(results);	
			})
		}
    });
};

// Gets all the posts within a certain conversation.
exports.allPosts = function(req, res){
	if (!req.user || !req.user._id) {
		resError(res, "Access denied.", "/error");
		return;
	}

    Conversation.findById( req.query.conversationId, function (err, convo){
    	if (err){
			resError(res, "Could not find posts for your conversation.");
		}
		var participantIds = convo.participants.map(function (p) {
			return p.user;
		})

		var found = false;
		var userString = JSON.stringify(req.user._id);
		for (var i = 0; i < participantIds.length; i++) {
			console.log(JSON.stringify(participantIds[i]), userString, JSON.stringify(participantIds[i]) === userString)
			if (JSON.stringify(participantIds[i]) === userString){
				found = true;
			}
		};
		if (!found){
			resError(res, "Access denied.", "/error");
			return;
		}

		var results = [];
		var jobs = convo.discussion.map(function(postId, index){
			var d = Q.defer();
			Post.findById(postId, function(err, post){
				if (err){
					d.reject();
				}
				results[index] = post;
				d.resolve(post);
			});
			return d.promise;
		});
		Q.allSettled(jobs).then(function (){
    		res.send({status: 'OK', success: true, message: results});	
		})
    });
};

// Sends back a list of a given user's conversations.
exports.search = function(req, res){
	var userId = req.query.userId;
	var recent = req.query.recent || false;
	var limit = req.query.limit || undefined;

	console.log('searching for user:', userId)

	User.findById(userId, function (err, user){
    	if (err || !user){
			resError(res, "Could not find user.");
			return;
		}

		var discussion = user.userConversations;
		if (limit){
			discussion = discussion.slice(0, limit);
		}
		var results = [];
		var jobs = discussion.map(function (convoObj, index) {
			var convoId = convoObj.conversation;
			var d = Q.defer();
			Conversation.findById(convoId, function(err, convo){
				if (err || (Date.now() - convo.lastEdited > 365*24*60*60*1000)){
					resError(res, "Could not find conversations");
					d.reject();
				}

				results[index] = {
					id: convoId,
					participants: convo.participants,
					category: convo.category,
					question: convo.question,
					isGroup: convo.isGroup,
					lastEdited: convo.lastEdited
				};
				d.resolve();
			});
			return d.promise;
		});

		Q.allSettled(jobs).then(function (){
    		res.send({status: 'OK', success: true, message: results});
		}, function(err){
			resError(res, "Could not fetch all conversations.");
		});
    });
}