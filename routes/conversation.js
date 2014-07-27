var db = require('./../db.js');
var Q = require('q');
var resError = require('./messaging').resError;
var findUserById = require('./user').findById;
var Utils = require('./../utils.js');

Conversation = db.models.Conversation;
User = db.models.User;
Post = db.models.Post;

/*
 * Creates a new conversation.
 *
 * @param {ObjectId} req.body.iceBreaker The ID of the ice breaking user.
 * @param {Array.<Object>} req.body.people An array of objects, each containing the id of a
 *      participant.
 * 
 */
exports.create = function(req, res){
	var iceBreakerId = req.body.iceBreaker;

	User.findById(iceBreakerId, function (err, user){
    	if (err) resError(res, "Could not find user.");

    	/*
    	* We fill in the firstName, lastName here on the server, so the client request only needs
    	* to pass in an array of people:
		* [{user: id}, {user: id2}, ...]
		*/
		var people = req.body.people || [];

		// Add the ice breaker to the list of participants and de-duplicate.
		people.push({user: iceBreakerId});
		people = Utils.union(people, function(person){
			return person.user;		// use id's for deduping comparison
		})

		// People data should fill in the first and last names of all the users.
		var peopleData = [];
		var jobs = people.map(function(entry, index) {
			return Q.promise(function(resolve, reject){
				var fields = 'username firstName lastName';

				User.findById(entry.user /* ObjectId */, fields, function(err, otherUser){
					if (err){
						reject('Could not find other user by id');
					} else {
						resolve(otherUser);
						peopleData[index] = otherUser;
					}
				});
			});
		});

		Q.allSettled(jobs)
			.then(function(){
				people = peopleData;

				for (var i = 0; i < people.length; i++) {
					people[i].isThrilled = false;
				};

				var conversation = new Conversation({
				    participants        : people,
				    category            : req.body.category,
				    question            : req.body.question,
				    isGroup             : req.body.isGroup,
				    lastEdited          : Date.now()
				});

				conversation.save(function(err){
					if (err) {
						resError(res, err);
						return;
					}

					var jobs = people.map(function(person, index){
						var d = Q.defer();
						User.findById(person._id, function(err, otherPerson){
							if (err || !otherPerson) {
								d.reject();
								return;
							}

							// Check that we aren't pushing in a duplicate conversation.
							var convoIds = otherPerson.userConversations.map(function(convo){
								return convo.conversation;
							});

							if (convoIds.indexOf(conversation.id) === -1){
								// If we are inviting someone to a conversation they have not seen.
								otherPerson.userConversations.push({conversation: conversation.id, hallOfFame: false});
								otherPerson.save(function(err){
									if (err) {
										d.reject();
										return;
									}
									d.resolve();	
								});
							} else {
								// If we are inviting someone to a conversation they are already in.
								d.resolve();
							}
						});
						return d.promise;
					});
					Q.allSettled(jobs).then(function (){
			    		res.send({status: 'OK', success: true, redirect: '/conversation/'+conversation._id});	
					});
				});
			})
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
							return;
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
			return p._id;
		})

		var found = false;
		var userString = JSON.stringify(req.user._id);
		for (var i = 0; i < participantIds.length; i++) {
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
					return;
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

	console.log('Fetching conversations for user:', userId);

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
				if (err || !convo || (Date.now() - convo.lastEdited > 365*24*60*60*1000)){
					d.reject("Could not find conversations");
					return;
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
			// Clean up results by removing null entries.
			var cleanResults = [];
			for (var i = 0; i < results.length; i++) {
				if (results[i]){
					cleanResults.push(results[i]);
				}
			};
    		res.send({status: 'OK', success: true, message: cleanResults});
		}, function(err){
			resError(res, "Could not fetch all conversations.");
		});
    });
}