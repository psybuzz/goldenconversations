$(document).ready(function() {
    var socket = io();

	// Load comments
	$.getJSON('/all', function (data) {
		var text = '';
		for (var i = 0; i < data.length; i++) {
			text += data[i].content + '<br>';
		};
		$('.display-area').append(text);
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
        	$('.display-area').append(message + '<br>');
    	} else {
    		alert('Save failed.');
    	}
    }
});