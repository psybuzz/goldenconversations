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

    addedPeople.push({'_id': id});
})

$('#new-input-modal button[type=submit]').click(function(evt) {
    evt.preventDefault();

    // Remove the modal for now.
    document.getElementById('new-input-modal').style.display = 'none';
    document.getElementById('lean_overlay').style.display = 'none';
});

function styleNewNames() {
    $('.userShape').each(function(){
        var $this = $(this);
        var originalNameText = $this.text();
        var colorValue;

        $('.name').each(function(){
            var $this = $(this);
            var storedName = $this.text();
            if (originalNameText === storedName) {
                colorValue = $this.find('.name-colors').css('background-color');
            }
        });

        var initials = $this.text()
                            .split(' ')
                            .map(function(s){ return s.charAt(0);})
                            .join('');
        $this.html(initials);
        $this.prepend('<div class="color-ball"></div>');
        $this.find('.color-ball').css({
            width: '15px',
            height: '15px',
            display: 'inline-block',
            backgroundColor: colorValue,
            borderRadius: '100%',
            margin: '0 7px'
        });
    });
}


$(document).ready(function() {
    var socket = io();

	// Load comments
	$.get('/conversation/posts', {conversationId: conversationId}, function (data) {
        if (data.success){
    		var text = '';
    		for (var i = 0; i < data.message.length; i++) {
                text += '<span class="userShape" data_id="' + data.message[i].userid + '">' + data.message[i].username + '</span>';
    			text += '<p>' + data.message[i].content + '</p><br>';
    		};
    		$('.display-area').append(text);
            
            styleNewNames();
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

    // Replace the newlines in the user's post with break tags in order to display the post properly right
    // after the user hits 'Send' on their post. This establishes the proper formatting in situations where
    // the user uses newlines in their post (such as when creating lists or when creating spacing between
    // multiple paragraph).
    var message = $('textarea').val();
    message = message.replace(/(?:\r\n|\r|\n)/g, '<br />');
    
	function onSubmitError(err){
		alert('Send failed.');
	}

    function onSubmitComment(data) {
    	if (data.success){
        	$('.display-area').append('<span class="userShape" data_id="' +  userId + '">' + 
                    user + '</span><p>' + message + '</p><br>');
            setScrollPos();
            $('textarea').val("");
            
            $('.userShape:last-of-type').each(function(){
                var $this = $(this);
                var originalNameText = $this.text();
                var colorValue;

                $('.name').each(function(){
                    var $this = $(this);
                    var storedName = $this.text();
                    if (originalNameText === storedName) {
                        colorValue = $this.find('.name-colors').css('background-color');
                    }
                });

                var initials = $this.text()
                                    .split(' ')
                                    .map(function(s){ return s.charAt(0);})
                                    .join('');
                $this.html(initials);
                $this.prepend('<div class="color-ball"></div>');
                $this.find('.color-ball').css({
                    width: '15px',
                    height: '15px',
                    display: 'inline-block',
                    backgroundColor: colorValue,
                    borderRadius: '100%',
                    margin: '0 7px'
                });
            });
            
    	} else {
    		alert('Nein. Write more. Unless you have written more than 10000 characters. Write less in that case.');
    	}
    }    

    
});

// Delete conversation button
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