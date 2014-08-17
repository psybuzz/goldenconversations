function peopleTypeEvent () {
	var q = $('#people_input').val();

	if (q == ''){
		$('#search_names').html('');
		return;
	}

	$.get('/user/search?query='+q, function(data){
		var namesHTML = '{{#each message}}<li data-id="{{_id}}" firstName="{{firstName}}" lastName="{{lastName}}" class="modal-name">{{firstName}} {{lastName}}</li>{{/each}}';
		var namesTemplate = Handlebars.compile(namesHTML);
		if (data.success){
			console.log(namesTemplate, data.message, namesTemplate(data))
			$('#search_names').html(namesTemplate(data));

			 // creating var to see if new names duplicate existing ones

			$('.selected-name').each(function(){
				var selectedName = $(this).attr('data-id');

				$('.modal-name').each(function(){
					var newName	= $(this).attr('data-id');
					if(selectedName === newName){
						$('.modal-name[data-id="'+newName+'"]').remove();
					}
				});
			}); // click on each new name

		} // if data success
	}); // get data
}
$('#people_input').keyup(_.debounce(peopleTypeEvent, 400));


$('#convo-creation-form').submit(function(evt) {
	evt.preventDefault();

	var addedPeople = [];
	$('.names-list li').each(function(){
		addedPeople.push($(this).attr('data-id'));
	});

	var question = $('input.good_input').val();
	$('#convo-creation-form button').attr('disabled', 'disabled');

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