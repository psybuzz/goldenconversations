$(document).ready(function() {
    var socket = io();

	// Load comments
	$.get('/conversation/posts', {conversationId: conversationId}, function (data) {
        if (data.success){
    		var text = '';
    		for (var i = 0; i < data.message.length; i++) {
                text += '<span class="userShape" data_id="' + data.message[i].userid + '">' + data.message[i].username + ': </span>';
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
	function onSubmitError(err){
		alert('Send failed.');
	}

    function onSubmitComment(data) {
    	if (data.success){
        	$('.display-area').append('<span class="userShape" data_id="' +  userId + '">' + 
                    user + ': </span><p>' + message + '</p><br>');
            setScrollPos();
            $('textarea').val("");
    	} else {
    		alert('Nein. Write more. Unless you have written more than 10000 characters. Write less in that case. Thank you. ');
    	}
    }    
});