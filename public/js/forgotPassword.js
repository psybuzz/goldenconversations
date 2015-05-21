/**
 * This file defines logic for the forgot password page.
 */

var $submitForm = $('#submitForm');
var $emailField = $('#submitForm input[type="email"]');
var $message = $('.message');
var $initialHelper = $('.initial-helper');

// Display a confirmation message when the email is submitted.
$submitForm.submit(function (evt){
	evt.preventDefault();

	// Display a waiting message.
	$message.html(STATUS_MESSAGE.WAITING);

	// Make the request for a reset email.
	$.post('/forgot', $(this).serialize(), function (data){
		if (data.success){
			// Display the success message.
			$message.html(STATUS_MESSAGE.SUCCESS);
			$initialHelper.hide();
			$submitForm.slideUp();
		} else{
			// Display the failure message.
			$message.html(STATUS_MESSAGE.FAILURE);
		}

	}).fail(function (data){
		$message.html(STATUS_MESSAGE.FAILURE);
		
	}).always(function (){
		$emailField.focus();
	});
});


// Define status messages to be displayed.
var STATUS_MESSAGE = {
	WAITING: 'Please wait as we send you a reset email...',
	SUCCESS: 'Thank you.<br>Please check your email inbox for further instructions on how to re-activate your Meaningful account!',
	FAILURE: 'Sorry, something went wrong when requesting a password reset email. Please try submitting the form again.'
};
