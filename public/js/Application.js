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

union = function () {
    debugger
    var args = Array.prototype.slice.call(arguments, 0);
    hash = {};
    union = [];

    if (typeof args[1] === 'function'){
        var items = args[0];
        var hashes = items.map(args[1]);
        for (var i = 0; i < items.length; i++) {
            if (hash[hashes[i]] !== true){
                hash[hashes[i]] = true;
                union.push(items[i]);
            }
        }

    } else {
        for (var arg = 0; arg < args.length; arg++) {
            for (var i = 0, len = args[arg].length; i < len; i++) {
                var item = args[arg][i];
                if (hash[item] !== true){
                    hash[item] = true;
                    union.push(item);
                }
            }
        }
    }

    return union;
}

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
                    user + ': </span><p>' + message + '</p><br>');
            setScrollPos();
            $('textarea').val("");
    	} else {
    		alert('Nein. Write more. Unless you have written more than 10000 characters. Write less in that case. Thank you. ');
    	}
    }    
});