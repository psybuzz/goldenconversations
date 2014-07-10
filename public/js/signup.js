$('#signup').on('submit', function (e){
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
	function onSubmitError(err){
		alert('Send failed.');
	}

    function onSubmitComment(data) {
    	if (data.success){
            // Display 'waiting' message
            alert("Your account is being created");

            // Redirect the user's browser to the redirect URL
            window.location.href = data.redirect;
    	} else {
    		alert('Nein. Write more. Unless you have written more than 10000 characters. Write less in that case. Thank you. ');
    	}
    }
});