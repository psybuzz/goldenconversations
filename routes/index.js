var resError = require('./messaging').resError;

/*
 * GET home page.
 */

exports.testing = function(req, res){
	Conversation.findOne( { question:"What does 'je ne sais quoi?' mean?" }, function (err, messages, count){
		if (err){
			res.render('testing', {title: 'Express' });
		}
		else{
			res.render('testing', {
				title				: messages.question,
				conversationId 		: messages.id
			});
		}
	});
};

exports.signup = function(req, res){
	res.render('signup', { title: 'Express' });
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


exports.conversation = function (req, res) {
	if (!req.user || !req.user._id) {
		res.render('error', {
			title: "Looks like you're not a part of that conversation.",
			message: "Ask the owners politely to invite you?"
		});
		return;
	}

	var id = req.params.id;
	Conversation.findOne( { _id: id }, function (err, convo){
		if (err){
			res.render('error', {title: 'Conversation not found', message: 'Forgeeeet about it!' });
			return;
		}
		var participantIds = convo.participants.map(function (p) {
			return p.user;
		})
		if (participantIds.indexOf(req.user._id) === -1){
			res.redirect('error', {
				title: "Looks like you're not a part of that conversation.",
				message: "Ask the owners politely to invite you?"
			});
			return;
		}
		
		res.render('conversation', {
			title				: convo.question,
			conversationId 		: convo.id,
			user				: req.user
		});
	});
}

exports.error404 = function(req, res) {
	res.render('error', {
		title: 'Sorry, we could not find what you were looking for.',
		message: 'Forgeeeet about it!'
	})
}

exports.error500 = function(req, res) {
	res.render('error', {
		title: 'Eum, je ne sais quoi?',
		message: 'Sorry, our site broke :('
	})
}