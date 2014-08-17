/**
 * This file exposes a general-purpose object, the Mailman. Its purpose is to send mail to users
 * via our GC gmail account.
 * 
 * Note that we only need to create one transporter object to send multiple emails. However, if we
 * eventually seek a future implementation with distributed computing for parallel emails, we may
 * need to create several transporters.
 */
var nodemailer = require('nodemailer');
var Q = require('q');

// Setup default email options
var defaultMailOptions = {
    from: 'goldenconversations@gmail.com',
    to: '',
    subject: 'Hello, it\'s GC',
    html: '' // Alternatively, we could use the 'text' property
};

// Try reading mailman's credentials from the environment first (Heroku), or use secret values as a
// fallback.
if (typeof process.env.MAILMAN_USER === 'undefined' ||
		typeof process.env.MAILMAN_PASS === 'undefined'){
	var secret = require('./secret');
	process.env.MAILMAN_USER = secret.mailmanUser;
	process.env.MAILMAN_PASS = secret.mailmanPass;
}
console.log('Using mail user/pass', process.env.MAILMAN_USER, process.env.MAILMAN_PASS)

// Create a reusable transporter that uses our Gmail account.
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.MAILMAN_USER,
        pass: process.env.MAILMAN_PASS
    }
});

// Add the transporter to an array.
var transporters = [];
transporters.push(transporter);

// Make a publicly-facing Mailman object.
var Mailman = {
	/**
	 * The list of transporters for use.
	 */
	transporters: transporters,

	/**
	 * Gets a transporter for use.
	 *
	 * @return {Nodemailer.Transporter} A transporter to use for sending mail.
	 */
	getTransporter: function (){
		if (transporters.length == 0){
			console.error('Error: no transporters available to send emails.');
		}
		return transporters[0];
	},

	/**
	 * Sends mail to a list of recipients. The options parameter allows a callback to be specified
	 * once the delivery is confirmed or failed. Alternatively, this function can be chained in a
	 * string of promises. Example uses:
	 *
	 * Mailman.sendMail({
	 *     recipients: ['me@me.com', 'you@you.com'],
	 *     subject: 'Account created',
	 *     html: 'Welcome to GC, new user!',
	 *     callback: function(){
	 *          console.log('New account emails have been sent.');
	 *     }
	 * });
	 * 
	 * OR
	 * 
	 * Mailman.sendMail({
	 *     recipients: ['me@me.com', 'you@you.com'],
	 *     subject: 'Account created',
	 *     html: 'Welcome to GC, new user!'
	 * }).then(function(){
	 *     console.log('New account emails have been sent.');
	 * });
	 *
	 * @param {Object} options The mail configuration.
	 *      @param {Array.String} options.recipients A list of recipient emails of the form
	 *           'user@service.com'.
	 *      @param {string} options.subject The subject of the email.
	 *      @param {string} options.html The HTML body of the email.
	 *      @param {Function} options.callback The callback to be executed after a response from the
	 *           mail server has returned.
	 *           
	 * @return {Q.Promise} A promise that settles once the a response from the mail server has
	 *      returned. It resolves or rejects depending on whether the sending was successful.
	 */
	sendMail: function (options){
		var deferred = Q.defer();
		var callback = options.callback;
		var mailOptions = {};
		mailOptions.from = defaultMailOptions.from;
		mailOptions.to = options.recipients.join(', ') || defaultMailOptions.to;
		mailOptions.subject = options.subject || defaultMailOptions.subject;
		mailOptions.html = options.html || defaultMailOptions.html;

		this.getTransporter().sendMail(mailOptions, function (err, data){
			// Log the error or the response here.
		    console.log(err || ('Message sent: ' + data.response));

		    if (err){
		    	deferred.reject(err);
		    } else {
		    	deferred.resolve(data);
		    }
		    if (callback) callback(err, data);
		});

		return deferred.promise;
	}
};

exports.Mailman = Mailman;
