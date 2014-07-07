
/*
 * GET home page.
 */

exports.index = function(req, res){
  Conversation.findOne( { question:"What is the best fruit in the world?" }, function (err, messages, count){
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