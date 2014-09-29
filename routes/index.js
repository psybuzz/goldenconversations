var resError = require('./messaging').resError;

/*
 * GET home page.
 */

exports.testing = function(req, res){
};

exports.signup = function(req, res){
	res.render('signup', { title: 'Express' });
};

exports.landing = function(req, res){
	res.render('landing', { title: 'Express' });
};

exports.home = function(req, res){
	if (!req.user){
		res.redirect('/login');
	} else {
		res.render('home', { 
			title: 'Express',
			user: req.user 
		});
	}
};

exports.login = function(req, res){
	res.render('login', { title: 'Express' });
};

exports.group = function(req, res){
	res.render('group', { title: 'Express' });
};

exports.halloffame = function(req, res){
	if (!req.user){
		res.redirect('/login');
	} else {
		res.render('halloffame', { 
			title: 'Express',
			user: req.user 
		});
	}
};

exports.conversation = function (req, res) {
	if (!req.user || !req.user._id) {
		res.render('error', {
			title: "Looks like you're not a part of that conversation.",
			message: "Ask the owners politely to invite you."
		});
		return;
	}

	var id = req.params.id;

	console.log('fetching convo with id', id)
	Conversation.findOne( { _id: id }, function (err, convo){
		if (err || !convo){
			res.render('error', {title: 'Conversation not found', message: 'Eh, forget about it!' });
			return;
		}

		var participantIds = convo.participants.map(function (p) {
			return p._id;
		})
		console.log('IDSSSS', participantIds)
		var found = false;
		var userString = JSON.stringify(req.user._id);
		for (var i = 0; i < participantIds.length; i++) {
			if (JSON.stringify(participantIds[i]) === userString){
				found = true;
			}
		};
		
		if (!found){
			res.redirect('error', {
				title: "Looks like you're not a part of that conversation.",
				message: "Ask the owners politely to invite you."
			});
			return;
		}
		

		var userName = req.user.firstName + " " + req.user.lastName;
		var userId = req.user._id;
		res.render('conversation', {
			title				: convo.question,
			conversationId 		: convo.id,
			user				: userName,
			userId				: userId,
			participants 		: convo.participants
		});
	});
}

exports.error404 = function(req, res) {
	res.render('error', {
		title: 'Sorry, we could not find what you were looking for.',
		message: 'Eh, forget about it!'
	})
}

exports.error500 = function(req, res) {
	res.render('error', {
		title: 'Eum, je ne sais quoi?',
		message: 'Sorry, our site broke :('
	})
}