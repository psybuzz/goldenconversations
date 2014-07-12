
/*
 * GET home page.
 */

exports.index = function(req, res){
	Conversation.findOne( { question:"What does 'je ne sais quoi?' mean?" }, function (err, messages, count){
		if (err){
			res.render('index', {title: 'Express' });
		}
		else{
			res.render('index', {
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
	}
	res.render('home', { 
		title: 'Express',
		user: req.user 
	});
};

exports.login = function(req, res){
	res.render('login', { title: 'Express' });
};

exports.group = function(req, res){
	res.render('group', { title: 'Express' });
};