function peopleTypeEvent (){
    var q = $('#people_input').val();
    if (q == ''){
        $('#search_names').html('');
        return;
    }

    $.get('/user/search?query='+q, function (data){
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
$('#search_names').on('click', '.name', function (e){
    var id = $(this).attr('id').slice(5);

    addedPeople.push({'_id': id});
})

$('#new-input-modal button[type=submit]').click(function (evt){
    evt.preventDefault();

    // Remove the modal for now.
    document.getElementById('new-input-modal').style.display = 'none';
    document.getElementById('lean_overlay').style.display = 'none';
});

$('.choice-modal button[type=submit]').click(function (evt){
    evt.preventDefault();

    var modal = document.getElementById('new-input-modal');
    var overlay = document.getElementById('lean_overlay');

    // Apply action.
    var action = $('.choice-modal').data('action');
    if (action === 'leave'){
        // Show placeholder waiting text.
        $('.choice-modal .question').text('Goodbye conversation...');

        // Make the request to leave.
        $.post(
                '/conversation/leave',
                {
                    conversationId: conversationId, 
                    _csrf: token
                },
                function (data){
                    // Restore the text.
                    $('.choice-modal .question').text(
                            'Are you sure that you want to leave this conversation?');

                    if (data.success){
                        window.location.href = '/home';
                    } else{
                        alert('Sorry, an error occurred when leaving.  Try again in a bit.');

                        // Remove the modal.
                        modal.style.display = 'none';
                        overlay.style.display = 'none';
                    }
                }
        );
    } else if (action === 'archive'){
        // Show placeholder waiting text.
        $('.choice-modal .question').text('Archiving conversation...');

        // Make the request to archive.
        $.post(
                '/conversation/archive',
                {
                    conversationId: conversationId, 
                    _csrf: token
                },
                function (data){
                    // Restore the text.
                    $('.choice-modal .question').text(
                            'Are you sure that you want to archive this conversation?');

                    if (data.success){
                        window.location.href = '/home';
                    } else{
                        alert('Sorry, an error occurred when archiving.  Try again in a bit.');

                        // Remove the modal.
                        modal.style.display = 'none';
                        overlay.style.display = 'none';
                    }
                }
        );
    } else{
        // Remove the modal.
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }
});

function styleNewNames (styleSelection){
    styleSelection.each(function (){
        var $currentShape = $(this);
        var originalNameText = $.trim($currentShape.text());
        var colorValue;

        $('.name').each(function (){
            var $currentName = $(this);
            var storedName = $currentName.text();
            if (originalNameText === storedName){
                colorValue = $currentName.find('.name-colors').css('background-color');
            }
        });

        var initials = $currentShape.text()
                .split(' ')
                .map(function(s){ return s.charAt(0);})
                .join('');
        $currentShape.html(initials);
        $('<div class="color-ball"></div>').prependTo($currentShape).css({
            backgroundColor: colorValue,
        });
    });
}

$(document).ready(function (){
    var socket = io();

	// Load comments
	$.get('/conversation/posts', {conversationId: conversationId}, function (data){
        if (data.success){
    		var text = '';
    		for (var i = 0; i < data.message.length; i++){
                var colorValue;
                $('.name').each(function(){
                    var $currentName = $(this);
                    var storedName = $currentName.text();
                    if (data.message[i].username === storedName){
                        colorValue = $currentName.find('.name-colors').css('background-color');
                    }
                });

                var initials = data.message[i].username
                        .split(' ')
                        .map(function(s){ return s.charAt(0);})
                        .join('');

                text += '<span class="userShape" data_id="' + data.message[i].userid + '"><div class="color-ball" style="background-color:'+ colorValue +';"></div>' + initials + '</span>';
    			text += '<p>' + data.message[i].content + '</p><br>';    
    		};
    		$('.display-area').append(text);
            setScrollPos();
        } else if (data.redirect){
            window.location.href = data.redirect;
        }
	});
});

$('#mainform').on('submit', function (e){
	e.preventDefault();

	$.ajax({
        url     : $(this).attr('action'),
        type    : $(this).attr('method'),
        dataType: 'json',
        data    : $(this).serialize(),
        success : onSubmitComment,
        error	: onSubmitError,
        timeout : 3000
    });

    var message = $('textarea').val();

	function onSubmitError (err){
		alert('Send failed.');
	}

    function onSubmitComment (data){
    	if (data.success){
            var messageWrapper = document.createElement('p');
            messageWrapper.innerText = message;

            $('.display-area').append('<span class="userShape" data_id="' +  userId + '">' + 
                    user + ' </span>')
                    .append(messageWrapper)
                    .append('<br>');
            setScrollPos();
            $('textarea').val("");
            
            styleNewNames($('.userShape:last-of-type'));
            
    	} else {
    		alert('Nein. Write more. Unless you have written more than 10000 characters. Write less in that case.');
    	}
    }    
});

// TODO: Have this logic execute only when a conversation has no users attached to it anymore since we don't 
// have an explicit 'Delete' button and since a conversation with no more users (once all of them have left)
// is the the only use case in which we want to delete a conversation.
$('#deleteConvo').click(function (){
    if (confirm('Are you sure you want to be rid of this nasty conversation forever?')){
        $.ajax({
            type: "POST",
            url: '/conversation/delete',
            dataType: 'json',
            data: {
                conversationId: conversationId,
                _csrf: token
            },
            success: function (data){
                if (data.success){
                    alert('Successfully deleted your conversation!');
                    window.location.href = data.redirect;
                } else{
                    alert('Whoops, something went wrong...');
                }
            }
        });
    }
});