// Put focus on form.
$('form input[type="email"]').focus();

// Redirect the user to the home page on successful login or display the invalid login message.
$('#login').submit(function (evt){
	evt.preventDefault();

	$.post('/login', $(this).serialize(), function (data){
		console.log(data);
		if (data.success){
			window.location.href = '/';
		}
	}).fail(function (data){
		// Display the invalid login message and set the cursor in the email field.
		$('.invalidLogin').css('display', 'inline');
		$('form input[type="email"]').focus();
	});
});

// Hide the invalid login message when the user starts typing in the email field if the
// invalid login message is visible.
$('form input[type="email"]').on("change keyup paste click", function (){
	if ($('.invalidLogin').is(':visible')){
		$('.invalidLogin').hide();
	}
});

// Hide the invalid login message when the user starts typing in the password field if the
// invalid login message is visible.
$('form input[type="password"]').on("change keyup paste click", function (){
	if ($('.invalidLogin').is(':visible')){
		$('.invalidLogin').hide();
	}
});
