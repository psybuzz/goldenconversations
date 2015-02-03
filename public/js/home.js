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

$('#edit-my-info').click(function (){
	window.location.href = '/account';
});

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

	var $form = $('#convo-creation-form');
	$.post('/conversation/create', {
		iceBreaker	        : userId,
	    category            : 'funny',
	    question            : question,
	    people  			: addedPeople,
	    isGroup             : false,
	    _csrf				: token,
	    content 			: $form.find('[name=content]').val()
	}, function (data) {
		console.log(data);
		if (data.success){
			alert('your conversation is created!');
			window.location.href = data.redirect;
		} else{
			alert(data.status);

			// Re-enable the button after a callback.
			$('#convo-creation-form button').attr('disabled', false);
		}

	});
});

// Compile Handlebars template for conversation entries.
var convoHtml = "<div class='convo'>\
	<h3><a href='/conversation/{{id}}'>{{{question}}}</a></h3>\
	{{#each participants}} <span data-id='{{_id}}' class='name'>{{{firstName}}} {{{lastName}}}</span> {{/each}}\
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

		// Displaying recent contacts.
		var uniqueNames = _.unique($('.name'), function(el){return el.dataset.id});
		uniqueNames.sort(function(b,a){
		    return $("[data-id='" + a.dataset.id + "']").length - $("[data-id='" + b.dataset.id + "']").length;
		});

		var $contactsContent = $('.contacts-content');
		for (var i=0; i<uniqueNames.length && i<=5; i++){
			if (uniqueNames[i].innerHTML !== $("#user-profile").text()){
				$contactsContent.append('<span class="recent-name"><a href="#user-modal" class="recent-contact" data-id="'+ uniqueNames[i].dataset.id +'" rel="leanModal">'+ uniqueNames[i].innerHTML +'</a></span>');
			}  
		}

		// Displaying convoshapes
		var $convoEntry = $('.convo');
		$convoEntry.each(function(){
			var numOfNames = $(this).children('.name').length;
			var newSvg;
			if (numOfNames === 2){
				newSvg = '<svg id="participantImage" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100px" height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"> <line id="line1" fill="none" stroke="#555555" stroke-width="2" stroke-miterlimit="10" x1="20.822" y1="20.822" x2="79.18" y2="79.179"/> <circle id="circle1" cx="20.823" cy="20.822" r="8.394"/> <circle id="circle2" cx="79.179" cy="79.18" r="8.394"/> </svg>';
			} else if (numOfNames === 3){
				newSvg = '<svg id="participantImage" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100px" height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"> <polygon fill="none" stroke="#000000" stroke-width="2" stroke-miterlimit="10" points="81.08,68 18.921,68 50.001,14.168 "/> <circle id="circle1" cx="81.08" cy="67.533" r="8.394"/> <circle id="circle2" cx="50" cy="13.702" r="8.394"/> <circle id="circle3" cx="18.921" cy="67.533" r="8.394"/> </svg>';
			} else if (numOfNames === 4){
				newSvg = '<svg id="participantImage" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100px" height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"> <line id="line1" fill="none" stroke="#555555" stroke-width="2" stroke-miterlimit="10" x1="25.087" y1="23.031" x2="78.948" y2="23.031"/> <line id="line2" fill="none" stroke="#555555" stroke-width="2" stroke-miterlimit="10" x1="25.087" y1="76.891" x2="78.948" y2="76.891"/> <line id="line3" fill="none" stroke="#555555" stroke-width="2" stroke-miterlimit="10" x1="25.087" y1="23.07" x2="25.087" y2="76.931"/> <line id="line4" fill="none" stroke="#555555" stroke-width="2" stroke-miterlimit="10" x1="78.948" y1="23.07" x2="78.948" y2="76.931"/> <circle id="circle1" cx="25.087" cy="23.031" r="8.394"/> <circle id="circle2" cx="78.948" cy="23.031" r="8.394"/> <circle id="circle3" cx="78.948" cy="76.891" r="8.394"/> <circle id="circle4" cx="25.087" cy="76.891" r="8.394"/> </svg>';
			} else if (numOfNames === 5){
				newSvg = '<svg id="participantImage" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100px" height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"> <line id="line1" fill="none" stroke="#555555" stroke-width="1.1259" stroke-miterlimit="10" x1="50" y1="21.13" x2="77.857" y2="42.708"/> <line id="line2" fill="none" stroke="#555555" stroke-width="1.1259" stroke-miterlimit="10" x1="77.857" y1="42.708" x2="67.071" y2="76.887"/> <line id="line3" fill="none" stroke="#555555" stroke-width="1.1259" stroke-miterlimit="10" x1="67.071" y1="76.887" x2="32.685" y2="76.887"/> <line id="line4" fill="none" stroke="#555555" stroke-width="1.1259" stroke-miterlimit="10" x1="32.685" y1="76.887" x2="22.143" y2="42.708"/> <line id="line5" fill="none" stroke="#555555" stroke-width="1.1259" stroke-miterlimit="10" x1="22.143" y1="42.708" x2="50" y2="21.13"/> <circle id="circle1" cx="50" cy="21.13" r="5.394"/> <circle id="circle2" cx="77.856" cy="42.708" r="8.394"/> <circle id="circle3" cx="67.07" cy="76.887" r="8.394"/> <circle id="circle4" cx="32.684" cy="76.886" r="8.394"/> <circle id="circle5" cx="22.142" cy="42.708" r="8.394"/> </svg>';
			} else if (numOfNames === 6){
				newSvg = '<svg id="participantImage" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100px" height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"> <line id="line1" fill="none" stroke="#555555" stroke-width="2" stroke-miterlimit="10" x1="33.666" y1="21.729" x2="66.297" y2="21.729"/> <line id="line2" fill="none" stroke="#555555" stroke-width="2" stroke-miterlimit="10" x1="66.297" y1="21.729" x2="82.646" y2="50"/> <line id="line3" fill="none" stroke="#555555" stroke-width="2" stroke-miterlimit="10" x1="82.646" y1="50" x2="66.297" y2="78.272"/> <line id="line4" fill="none" stroke="#555555" stroke-width="2" stroke-miterlimit="10" x1="66.297" y1="78.272" x2="33.666" y2="78.272"/> <line id="line5" fill="none" stroke="#555555" stroke-width="2" stroke-miterlimit="10" x1="33.666" y1="78.272" x2="17.355" y2="50"/> <line id="line6" fill="none" stroke="#555555" stroke-width="2" stroke-miterlimit="10" x1="17.355" y1="50" x2="33.666" y2="21.729"/> <circle id="circle1" cx="33.665" cy="21.729" r="8.394"/> <circle id="circle2" cx="66.297" cy="21.729" r="8.394"/> <circle id="circle3" cx="82.646" cy="50" r="8.394"/> <circle id="circle4" cx="66.297" cy="78.272" r="8.394"/> <circle id="circle5" cx="33.666" cy="78.272" r="8.394"/> <circle id="circle6" cx="17.355" cy="50" r="8.394"/> </svg>';
			}
			$(this).prepend(newSvg);
		}); // convoshapes 
	}
});