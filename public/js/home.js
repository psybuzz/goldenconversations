function peopleTypeEvent () {
	var q = $('#people_input').val();
	if (q == ''){
		$('#search_names').html('');
		return;
	}

	$.get('/user/search?query='+q, function(data){
		var namesHTML = '{{#each message}}<span id="name-{{_id}}" firstName="{{firstName}}" lastName="{{lastName}}" class="name">{{firstName}} {{lastName}}</span>{{/each}}';
		var namesTemplate = Handlebars.compile(namesHTML);
		if (data.success){
			console.log(namesTemplate, data.message, namesTemplate(data))
			$('#search_names').html(namesTemplate(data));
		}
	});
}
$('#people_input').keyup(_.debounce(peopleTypeEvent, 150));

var addedPeople = [];
$('#search_names').on('click', '.name', function (e) {
	var id = $(this).attr('id').slice(5);

	addedPeople.push({user: id});
})

$('#new-input-modal button[type=submit]').click(function(evt) {
	evt.preventDefault();


	var question = $('input.good_input').val();
	if (question == '') return;

	$.post('/conversation/create', {
		iceBreaker	        : userId,
	    category            : 'funny',
	    question            : question,
	    people  			: addedPeople,
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
		console.log(data)
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