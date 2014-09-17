function searchAndLoadNames (){
	var q = $('#people_input').val();
	if (q === ''){
		$('#search_names').html('');
		return;
	}

	$.get('/user/search?query='+q, function(data){
		var namesHTML = '{{#each message}}<li data-id="{{_id}}" firstName="{{firstName}}" lastName="{{lastName}}" class="modal-name">{{firstName}} {{lastName}}</li>{{/each}}';
		var namesTemplate = Handlebars.compile(namesHTML);
		if (data.success){
			console.log(namesTemplate, data.message, namesTemplate(data))
			$('#search_names').html(namesTemplate(data));

			// Check if any user included in the search results has already been selected for this conversation. If so, do not display this user's name in the search results.
			$('.selected-name').each(function(){
				var selectedName = $(this).attr('data-id');
				$('.modal-name').each(function(){
					var newName	= $(this).attr('data-id');
					if (selectedName === newName){
						$('.modal-name[data-id="'+newName+'"]').remove();
					}
				});
			}); 
		} 
	}); 
}
var searchAndLoadNamesDebounced = _.debounce(searchAndLoadNames, 400);

var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

$('#people_input').keyup(function (e){
	if (e.keyCode === 13){		// If the enter key was pressed
		var q = $('#people_input').val();
		$('#search_names').html('');
		console.log(1)
		if (emailRegex.test(q)){
			console.log(2)
			$('#people_input').val('');
			$('.names-list').append('<li data-id="' + q + '" class="selected-name">' + q + '<div class="name_remove">X</div></li>')
			$('#people_input').val('').attr('placeholder', 'Add More').focus().css({
				display: 'inline'
			});
		}

	} else {					// Otherwise, load results of a global name search
		searchAndLoadNamesDebounced();
	}
});

// Disable normal submission, because it can be triggered by the enter key. Instead, form submission
// can be handled by clicking the button.
$('#convo-creation-form').submit(function (evt){
	evt.preventDefault();
});

// Handles submissions for the create conversation form when the button is clicked.
$('#create-submit-button').click(function (){
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
	{{#each participants}} <span data-id='{{_id}}'' class='name'>{{firstName}} {{lastName}}</span> {{/each}}\
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

		// Populate the recent contacts list
		var $name = $('.name');
		var names = [];
		var uniqueArray = [];
		var arrResultObj = {};

		for (var i=0; i<$name.length; i++) {
			names[i] = {
				userId: $name.eq(i).data("id"), 
				userName: $name.eq(i).text(),
				userCount: 0
			};
		};

		// Convert the names array into an object, removing duplicates
		for (var i = 0; i < names.length; i++) {
		    var item = names[i];
		    arrResultObj[item.userId] = item;
		}

		// Convert the object into an array
		j = 0;    
		for (var item in arrResultObj){
		    uniqueArray[j++] = arrResultObj[item];
		}

		// Counting how many users there are on screen
		$name.each(function(){
			var $id = $(this).data('id');
			for(var i=0; i<uniqueArray.length; i++) {
				if ( $id === uniqueArray[i].userId) {
					uniqueArray[i].userCount++; 
				} 
			};	
		});

		// Removing the userCount of self
		for (var i=0; i<uniqueArray.length; i++) {
			if (uniqueArray[i].userName === $("#user-profile").text()){
				uniqueArray[i].userName = "null";
				uniqueArray[i].userId = "null";
				uniqueArray[i].userCount = 0;
			};
		};

		// Sort the array in descending order
		uniqueArray.sort(function(a,b){ 
			return parseFloat(b.userCount) - parseFloat(a.userCount);
		});
		
		for (var i=0; i<uniqueArray.length; i++) {
			if (i<5 && uniqueArray[i].userCount !== 0){
				$('.contacts-content').append('<span class="recent-name"><a href="#user-modal" class="recent-contact" data-id="'+ uniqueArray[i].userId +'" rel="leanModal">'+ uniqueArray[i].userName +'</a></span>')
			}
		}
	}
});