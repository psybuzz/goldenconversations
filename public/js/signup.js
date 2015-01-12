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
            // Display an error alert if the server provides an error status.
            if (data.status === 'INVALID_EMAIL'){
                alert("Please enter a valid email address as your username.");
            } else if (data.status === 'BAD_NAME_LENGTH'){
                alert("Sorry, your name is too short or too long.  " +
                        "Do you have a nickname between 2 and 128 characters?");
            } else if (data.status === 'EXISTING_USER'){
                alert("It seems there is already an account for this email!  " +
                        "If you are locked out, contact goldenconversations@gmail.com");
            } else if (data.status === 'BAD_PASS_LENGTH'){
                alert("Please make sure your password is at least 8 characters.");
            } else if (data.status === 'ALPHANUMERIC_NAME'){
                alert("Please make sure your name doesn't contain strange symbols.");
            } else{
                alert("Something went wrong when sending the information.  Try again in a bit!");
            }
    	}
    }
});