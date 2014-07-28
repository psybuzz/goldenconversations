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
 */
exports.create = function (req, res){
	var iceBreakerId = req.body.iceBreaker;

	User.findById(iceBreakerId, function (err, user){
    	if (err) resError(res, "Could not find user.");

    	/*
    	* We fill in the firstName, lastName here on the server, so the client request only needs
    	* to pass in an array of people:
		* [{_id: id}, {_id: id2}, ...]
		*/
		var people = req.body.people || [];

		// Add the ice breaker to the list of participants and de-duplicate.
		people.push({'_id': iceBreakerId});
		people = Utils.union(people, function (person){
			return person._id;		// use id's for deduping comparison
		})

		// People data should fill in the first and last names of all the users.
		var peopleData = [];
		var jobs = people.map(function (entry, index){
			return Q.promise(function (resolve, reject){
				var fields = 'username firstName lastName';

				User.findById(entry._id, fields, function (err, otherUser){
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
			.then(function (){
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

				conversation.save(function (err){
					if (err) {
						resError(res, err);
						return;
					}

					var jobs = people.map(function (person, index){
						var d = Q.defer();
						User.findById(person._id, function (err, otherPerson){
							if (err || !otherPerson) {
								d.reject();
								return;
							}

							// Check that we aren't pushing in a duplicate conversation. If the user
							// already has the conversation in his/her list, we simply continue.
							var convoIds = otherPerson.userConversations.map(function (convo){
								return convo.conversation;
							});

							if (convoIds.indexOf(conversation.id) === -1){
								// If we are inviting someone to a conversation they have not seen.
								otherPerson.userConversations.push({conversation: conversation.id, hallOfFame: false});
								otherPerson.save(function (err){
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

exports.delete = function (req, res){
	if (!req.user || !req.user._id) {
		resError(res, "Access denied.", "/error");
		return;
	}
	var convoPromise = Q.promise(function (resolve, reject){
		console.log('START DELETE', req.body.conversationId)
		Conversation.findById( req.body.conversationId, function (err, convo){
			console.log('FOUND>>>')
	    	if (err){
				reject(res, "Could not find your conversation.");
				return;
			}
			var participantIds = convo.participants.map(function (p){return p._id});
			var userString = JSON.stringify(req.user._id);
			var participantIdStrings = participantIds.map(function (id){return JSON.stringify(id)});
			var found = participantIdStrings.indexOf(userString) !== -1;

			if (found){
				console.log('RESOLVING CONVO')
				resolve(convo);
			} else {
				reject(res, "Access denied.", "/error");
			}
		});
	}).then(function (convo) {
		console.log('REMOVING POSTS')
		// Remove associated posts.
		var posts = convo.discussion;
		var removeJobs = posts.map(function (postId){
			return Q.promise(function (resolve, reject) {
				console.log('RRRRR', postId)
				Post.findByIdAndRemove(postId, function(err){
					if (err){
						reject('Could not find post.');
					} else {
						console.log('RPR...')
						resolve();
					}
				});
			});
		});
		
		return [convo, Q.allSettled(removeJobs)];
	}, resError).spread(function (convo, results){
		console.log('CREAM SPREAd')
		// Associated posts removed.
		results.forEach(function (result){
	        if (result.state !== "fulfilled"){
	            console.log('Some dangling posts were not removed!', result.reason);
	        }
	    });

		// Remove convo from each participant's list of conversations.
		var userIds = convo.participants.map(function (p){return p._id});
		var removeJobs = userIds.map(function (userId){
			return Q.promise(function (resolve, reject) {
				User.findById(userId, function(err, user){
					if (err){
						reject('Could not find user.');
						return;
					}
					console.log('FOUND USER:', user.firstName, 'with', user.userConversations.length, 'convos')
					console.log(user.userConversations.map(function (c){return c.conversation}))
					console.log('looking for', convo._id)
							


					// Get the index of the conversation to remove within the user's list.
					var index = user
							.userConversations
							.map(function (c){return JSON.stringify(c.conversation)})
							.indexOf(JSON.stringify(convo._id));
					console.log('REMOVING CONVO', user.userConversations[index], index)
					if (index !== -1){
						user.userConversations.splice(index, 1);
						var index2 = user
							.userConversations
							.map(function (c){return JSON.stringify(c.conversation)})
							.indexOf(JSON.stringify(convo._id));
						console.log('***** after remove, i is', index2)
					}
					user.save(function (saveErr){
						if (saveErr){
							reject('Could not save user\'s list after removal');
						} else {
							console.log('SAVED USER REMOV')
							resolve();
						}
					});
				});
			});
		}); // removeJobs

		return Q.allSettled(removeJobs);
	}).then(function (results){
		// Associated user convo lists updated.
		results.forEach(function (result){
	        if (result.state !== "fulfilled"){
	            console.log('Some users\' conversation lists were not updated!', result.reason);
	        }
	    });

		// Remove the actual conversation.
		Conversation.findByIdAndRemove(req.body.conversationId, function (err){
			if (err) return resError(res, message);

			console.log('>>>>>>>>>>>>>>>>>>>>>>>>')

			// Redirect back home.
			res.send({success: true, redirect: '/home'});
		});
	});
};

exports.update = function (req, res){
	Conversation.findByIdAndUpdate(req.body.objectId, req.body.updata, function (err){
		if (err) return console.log(err);
	});
};

exports.getTestMessages = function (req, res){
	// find all messages
    Conversation.find( { question:"What does 'je ne sais quoi?' mean?" }, function (err, messages, count){
    	if (err){
			resError(res, "Could not find messages collection in DB.");
		}

		var results = [];
		if (messages[0]){
			var jobs = messages[0].discussion.map(function (postId, index){
				var d = Q.defer();
					Post.find({ _id: postId }, function (err, post){
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
exports.allPosts = function (req, res){
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
		var jobs = convo.discussion.map(function (postId, index){
			var d = Q.defer();
			Post.findById(postId, function (err, post){
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
exports.search = function (req, res){
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
		var jobs = discussion.map(function (convoObj, index){
			var convoId = convoObj.conversation;
			var d = Q.defer();
			Conversation.findById(convoId, function (err, convo){
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
			var cleanResults = Utils.denullify(results);
			res.send({status: 'OK', success: true, message: cleanResults});
		}, function (err){
			resError(res, "Could not fetch all conversations.");
		});
    });
}