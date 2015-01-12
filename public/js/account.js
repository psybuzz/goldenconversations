/**
 * This file defines logic for the account settings page.
 */

var $passwordForm = $('#passwordForm');
var $passField = $('#passwordForm input[name="newPassword"]');
var $passConfirmField = $('#passwordForm input[name="newPasswordConfirm"]');
var $message = $('.message');

// Display a confirmation message when the email is submitted.
$passwordForm.submit(function (evt){
	evt.preventDefault();

	// Check that the two passwords match.
	if ($passField.val() !== $passConfirmField.val()){
		$message.html(STATUS_MESSAGE.FAILURE_MISMATCH);
		return;
	}

	// Display a waiting message.
	$message.html(STATUS_MESSAGE.WAITING);

	// Make the request for a reset email.
	$.post('/reset/', $(this).serialize(), function (data){
		console.log(data);
		if (data.success){
			// Display the success message.
			$message.html(STATUS_MESSAGE.SUCCESS);
			$passwordForm.slideUp();

			// Redirect if needed.
			if (data.redirect){
				setTimeout(function (){
					window.location.href = data.redirect;
				}, 3000);
			}

		} else {
			// Display the failure message.
			if (data.status === 'INVALID_TOKEN'){
				$message.html(STATUS_MESSAGE.FAILURE_TOKEN);
			} else if (data.status === 'PASS_CONFIRM_MISMATCH'){
				$message.html(STATUS_MESSAGE.FAILURE_MISMATCH);
			} else{
				$message.html(STATUS_MESSAGE.FAILURE_DB);
			}
		}

	}).fail(function (data){
		$message.html(STATUS_MESSAGE.FAILURE_NETWORK);

	}).always(function (){
		$passField.focus();
	});
});


// Define status messages to be displayed.
var STATUS_MESSAGE = {
	WAITING: 'Please wait, as we reset your password...',
	SUCCESS: 'Thank you.<br>Your Meaningful account password has been reset!',
	FAILURE_DB: 'Sorry, something went wrong, and we were unable to reset your password.  Please try submitting the form again.',
	FAILURE_TOKEN: 'Sorry, it looks like the password reset email has expired.  Please request another reset email.',
	FAILURE_MISMATCH: 'Please make sure that the two passwords match.',
	FAILURE_NETWORK: 'It looks like your computer cannot reach our server!  Could you try refreshing the page?'
};
