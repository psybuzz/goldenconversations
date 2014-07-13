// Launch the dialog when clicking on the 'Start a new conversation' link.
$('#new-convo').click(function(evt) {
	evt.preventDefault();

	var question = prompt('Let\'s discuss:');
	if (question == '') return;
	alert('creating your new conversation...');

	$.post('/conversation/create', {
		iceBreaker	        : userId,
	    category            : 'funny',
	    question            : question,
	    isGroup             : false,
	    _csrf				: token
	}, function (data) {
		console.log(data);
		if (data.success){
			alert('your conversation is created!');
			window.location.href = data.redirect;
		}
	});
});

// Compile Handlebars template for conversation entries.
var convoHtml = "<div class='convo'>\
	<h3><a href='/conversation/{{id}}'>{{question}}</a></h3>\
	{{#each participants}} <span class='name'>{{firstName}} {{lastName}}</span> {{/each}}\
</div>";
var convoTemplate = Handlebars.compile(convoHtml);

// Load your personal conversations.
$.get('/conversation/search', {
	userId: userId
}, function(data){
	if (data.success){
		var container = $('#conversation-entries');
		for (var i = 0; i < data.message.length; i++) {
			var convo = data.message[i];
			var html = convoTemplate({
				id: convo.id,
				category: convo.category,
				isGroup: convo.isGroup,
				lastEdited: convo.lastEdited,
				question: convo.question,
				participants: convo.participants,
			});
			container.append(html);
		};
	}
});