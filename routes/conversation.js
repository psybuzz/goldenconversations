var db = require('./../db.js');
var Q = require('q');
var resError = require('./messaging').resError;
var findUserById = require('./user').findById;
var Utils = require('./../utils.js');
var validator = require('validator');
var Mailman = require('./../mailman.js').Mailman;
var PostHandler = require('./post');

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
	if (!req.user || !req.user._id){
		return resError(res, "Sorry, it looks like you're not logged in!");
	}

	var iceBreakerId = req.user._id;
	var firstPostContent = req.body.content || '';
	firstPostContent = firstPostContent.trim();

	// Validate first post content if it is non-empty.
	if ((!validator.isLength(firstPostContent, 140, 10000) || validator.isNull(firstPostContent)) &&
				firstPostContent.length > 0){
		return resError(res, "First post contents should be at least 140 characters!");
	}

	/*
	 * We fill in the firstName, lastName here on the server, so the client request only needs
	 * to pass in an array of id/emails:
	 * [id1, id2, ..., email1, id7, email2, id8]
	 */
	var idOrEmails = req.body.people || [];
	var people = idOrEmails.filter(function(idOrEmail){return idOrEmail.indexOf('@') === -1});
	var emails = idOrEmails.filter(function(idOrEmail){return idOrEmail.indexOf('@') !== -1});

	// Limit from 1 to 5 people, excluding oneself.
	idOrEmails = idOrEmails.filter(function(idOrEmail){return idOrEmail !== iceBreakerId});
	if (idOrEmails.length < 1 || idOrEmails.length > 5){
		return resError(res, "Keep it intimate!  Please have 2 to 6 people in a conversation.");
	}

	// Add the ice breaker to the list of participants and de-duplicate.
	people.push(iceBreakerId);
	people = Utils.union(people);

	// TODO(erik): The emails that don't match up with users should really go into a list of
	// invited-but-have-not-yet-signed-up global list somewhere. This may require some schema
	// changes.

	// People data should fill in the first and last names of all the users.
	var peopleData = [];
	var jobs = people.map(function (entry, index){
		return Q.promise(function (resolve, reject){
			var fields = 'username firstName lastName';

			User.findById(entry, fields, function (err, otherUser){
				if (err || !otherUser){
					reject('Could not find other user by id');
				} else{
					resolve(otherUser);
					peopleData[index] = otherUser;
				}
			});
		});
	});

	// Wait for information to populate on all users before saving.
	Q.allSettled(jobs)
		.then(function (){
			people = peopleData;

			// Set all participants' thrilled flag to false.
			for (var i = 0; i < people.length; i++){
				people[i].isThrilled = false;
			}

			// Create the conversation.
			var conversation = new Conversation({
			    participants        : people,
			    category            : validator.escape(req.body.category),
			    question            : validator.escape(req.body.question),
			    isGroup             : req.body.isGroup,
			    lastEdited          : Date.now()
			});

			// Save the newly created conversation.
			conversation.save(function (err, savedConvo){
				if (err){
					resError(res, err);
					return;
				}

				var jobs = people.map(function (person, index){
					var d = Q.defer();
					User.findById(person._id, function (err, otherPerson){
						if (err || !otherPerson){
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
								if (err){
									d.reject();
									return;
								}
								d.resolve();	
							});
						} else{
							// If we are inviting someone to a conversation they are already in.
							d.resolve();
						}
					});
					return d.promise;
				});
				Q.allSettled(jobs).then(function (){
					// Redirect regardless of email success.
					res.send({status: 'OK', success: true, redirect: '/conversation/'+conversation._id});

					// Send emails to notify participants of the new conversaion.
					// This assumes that the 'username' field of a User is his/her email.
					var peopleEmails = peopleData.map(function (person){
						if (person) return person.username;
					});

					recipients = Utils.denullify(Utils.union(peopleEmails, emails));
					var question = req.body.question;
					var cleanQuestion = question;
					if (question.length > 40){			// 40 char subject limit
						cleanQuestion = question.slice(0, 40) + '...';
					}

					Mailman.sendMail({
						recipients: recipients,
						subject: 'GC: ' + cleanQuestion,
						html: 'Hello,<br><br>Someone recently sought your opinion for this question:' +
							'<h2>'+question+'</h2><br>What are your thoughts?<br>' +
							'Continue the conversation on <a href="http://goldenconversations.heroku.com/">Golden Conversations</a>.',
						callback: function(){
							console.log('New conversation notification emails have been sent.');
						}
					});

					// Create a post for the creator's first thoughts.
					if (firstPostContent.length > 0){
						var postOptions = {
							user: req.user,
							content: firstPostContent.trim(),
							conversationId: savedConvo._id
						};
						PostHandler.createPost(postOptions, function (){
							console.log('Created first post!');
						}, function (err){
							console.error('Error creating first post: ', err);
						});
					}
				});
			});
		});
};

/**
 * Action when a user leaves a conversation.
 */
exports.leave = function (req, res){
	if (!req.user || !req.user._id){
		resError(res, "Access denied.", "/error");
		return;
	}

	var convoPromise = Q.promise(function (resolve, reject){
		Conversation.findById( req.body.conversationId, function (err, convo){
	    	if (err || !convo){
				reject(res, "Could not find your conversation.");
				return;
			}

			var participantIds = convo.participants.map(function (p){return p._id});
			var userString = JSON.stringify(req.user._id);
			var participantIdStrings = participantIds.map(function (id){return JSON.stringify(id)});
			var foundIndex = participantIdStrings.indexOf(userString);

			if (foundIndex !== -1){
				// Remove the user from the convo's participant list.
				convo.participants.splice(foundIndex, 1);

				// Modifying the participants is an operation that requires the convo to be saved
				// again.
				convo.save(function (err){
					if (err){
						reject(res, "Unable to update the conversation.");
					} else{
						resolve(convo);
					}
				});
			} else{
				reject(res, "Access denied.", "/error");
			}
		});
	}).then(function (convo){
		return Q.promise(function (resolve, reject){
			// Remove convo from the user's list of conversations.
			User.findById(req.user._id, function(err, user){
				if (err || !user){
					reject(res, 'Could not find user.');
					return;
				}

				// Get the index of the conversation to remove within the user's list.
				var index = user
						.userConversations
						.map(function (c){return JSON.stringify(c.conversation)})
						.indexOf(JSON.stringify(convo._id));
				if (index !== -1){
					user.userConversations.splice(index, 1);
				}
				user.save(function (saveErr){
					if (saveErr){
						reject(res, 'Could not save user\'s list after removal');
					} else{
						if (convo.participants.length === 0){
							resolve({removePosts: true, posts: convo.discussion});
						} else{
							resolve({removePosts: false});
						}
					}
				});
			});
		});
	}).then(function (options){
		if (options.removePosts){
			// Remove associated posts.
			var posts = options.posts;
			var removeJobs = posts.map(function (postId){
				return Q.promise(function (resolve, reject){
					Post.findByIdAndRemove(postId, function(err){
						if (err){
							reject(res, 'Could not find post.');
						} else{
							resolve();
						}
					});
				});
			});

			// Remove the conversation itself.
			var removeConversationPromise = Q.promise(function (resolve, reject){
				Conversation.findByIdAndRemove(req.body.conversationId, function (err){
					if (err){
						reject(res, 'Could not remove the empty conversation.');
					} else{
						resolve();
					}
				});
			});
			removeJobs.push(removeConversationPromise);

			return Q.allSettled(removeJobs);
		} else{
			return Q.allSettled([]);
		}
	}, resError).spread(function (results){
		// Redirect back to home after leaving a convo.
		res.send({success: true, redirect: '/home'});

		// Logging for failed posts removed.
		results.forEach(function (result){
			if (result.state !== "fulfilled"){
				console.log('Some dangling posts were not removed!', result.reason);
			}
		});
	});
};

/**
 * Action when a user archives a conversation.
 */
exports.archive = function (req, res){
	if (!req.user || !req.user._id){
		return resError(res, "Access denied.", "/error");
	}

	// Search through the user's conversation list until the conversation with the correct
	// id is found. 
	User.findById( req.user._id, function (err, user){
		if (err || !user){
			return resError(res, "Could not find the user.");
		}

		// Save the id of the conversation that we want to archive.
		var targetConversationId = JSON.stringify(req.body.conversationId);

		// Find the index at which the target conversation exists amongst all of the user's conversations.
		var conversationIds = user.userConversations.map(function(p) {return p.conversation});
		var conversationIdStrings = conversationIds.map(function(id) {return JSON.stringify(id)});
		var foundIndex = conversationIdStrings.indexOf(targetConversationId);

		// Modify the hallOfFame boolean associated with the conversation to true if it exists.
		if (foundIndex !== -1) {
			user.userConversations[foundIndex].hallOfFame = true;

			// Save the modified user object.
			user.save(function(err){
				if (err) return resError(res, "Could not save user to database.");

				// If there are no errors, proceed to update the isThrilled boolean of the user
				// in the conversation object to true and save this object.
				Conversation.findById(req.body.conversationId, function(err, convo){
					if (err || !convo) return resError(res, "Could not find conversation");

					// Save the id of the user whose isThrilled boolean we want to set as true.
					var userString = JSON.stringify(req.user._id);

					// Find the index at which the target user exists amongst all of the conversation's participants.
					var participantIds = convo.participants.map(function (p){return p._id});
					var participantIdStrings = participantIds.map(function (id){return JSON.stringify(id)});
					var userIndex = participantIdStrings.indexOf(userString);

					// Modify the isThrilled boolean associated with the appropriate participant if 
					// he/she exists.
					if (userIndex !== -1){
						// Update the user's isThrilled boolean.
						convo.participants[userIndex].isThrilled = true;

						// Save the modified conversation.
						convo.save(function(err){
							if (err) return resError(res, "Could not save conversation to database.");

							// After everything is done, send the response back to the user with success.
							res.send({success: true, redirect: '/home'});
						});
					} else{
						return resError(res, "Access denied.", "/error");
					}
				});
			});
		} else{
			return resError(res, "Access denied.", "/error");
		}
	});
};

exports.delete = function (req, res){
	if (!req.user || !req.user._id){
		resError(res, "Access denied.", "/error");
		return;
	}

	var convoPromise = Q.promise(function (resolve, reject){
		Conversation.findById( req.body.conversationId, function (err, convo){
	    	if (err || !convo){
				reject(res, "Could not find your conversation.");
				return;
			}
			var participantIds = convo.participants.map(function (p){return p._id});
			var userString = JSON.stringify(req.user._id);
			var participantIdStrings = participantIds.map(function (id){return JSON.stringify(id)});
			var found = participantIdStrings.indexOf(userString) !== -1;

			if (found){
				resolve(convo);
			} else{
				reject(res, "Access denied.", "/error");
			}
		});
	}).then(function (convo){
		// Remove associated posts.
		var posts = convo.discussion;
		var removeJobs = posts.map(function (postId){
			return Q.promise(function (resolve, reject){
				Post.findByIdAndRemove(postId, function(err){
					if (err){
						reject('Could not find post.');
					} else{
						resolve();
					}
				});
			});
		});
		
		return [convo, Q.allSettled(removeJobs)];
	}, resError).spread(function (convo, results){
		// Associated posts removed.
		results.forEach(function (result){
	        if (result.state !== "fulfilled"){
	            console.log('Some dangling posts were not removed!', result.reason);
	        }
	    });

		// Remove convo from each participant's list of conversations.
		var userIds = convo.participants.map(function (p){return p._id});
		var removeJobs = userIds.map(function (userId){
			return Q.promise(function (resolve, reject){
				User.findById(userId, function(err, user){
					if (err){
						reject('Could not find user.');
						return;
					}

					// Get the index of the conversation to remove within the user's list.
					var index = user
							.userConversations
							.map(function (c){return JSON.stringify(c.conversation)})
							.indexOf(JSON.stringify(convo._id));
					if (index !== -1){
						user.userConversations.splice(index, 1);
					}
					user.save(function (saveErr){
						if (saveErr){
							reject('Could not save user\'s list after removal');
						} else{
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
			if (err) return resError(res, "Could not remove the conversation.");

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
	if (!req.user || !req.user._id){
		resError(res, "Access denied.", "/error");
		return;
	}

	Conversation.findById(req.query.conversationId, function (err, convo){
		if (err || !convo){
			resError(res, "Could not find posts for your conversation.");
		}
		var participantIds = convo.participants.map(function (p){
			return p._id;
		})

		var found = false;
		var userString = JSON.stringify(req.user._id);
		for (var i = 0; i < participantIds.length; i++){
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
				if (err || !post){
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
	var limit = req.query.limit ? validator.toInt(req.query.limit) : undefined;
	var offset = req.query.offset ? validator.toInt(req.query.offset) : 0;

	console.log('Fetching conversations for user:', userId);

	User.findById(userId, function (err, user){
    	if (err || !user){
			resError(res, "Could not find user.");
			return;
		}

		var discussion = user.userConversations;
		if (limit){
			discussion = discussion.slice(offset, limit);
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