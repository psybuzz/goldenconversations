/**
 * Golden Configuration.
 *
 * IMPORTANT: This file is now whitelisted for GitHub, but should not be shared with outsiders if
 * possible. It no longer contains sensitive information in plaintext.
 *
 * This file manages application level configuration variables. As our Heroku instance now holds
 * private information, we simply need to load these variables from Heroku. More information on how
 * these variables are stored and changed can be found here:
 * https://devcenter.heroku.com/articles/config-vars
 */

// Reset 'undefined'.
(function(undefinedParam){
	undefined = undefinedParam;
})();

// Secrets.
if (typeof process.env.DB_USER === 'undefined' || typeof process.env.DB_PASS === 'undefined'){
	var secret = require('./secret');
	process.env.DB_USER = secret.user;
	process.env.DB_PASS = secret.pass;
}

var access = {
	user: process.env.DB_USER,
	pass: process.env.DB_PASS
};

// Generate a one-time use values.
var oneTime = function(value){
	var used = false;

	return function(){
		if (used === false){
			used = true;
			return value;
		}
	}
}

/*
 * Expose username and password as one-time use functions.
 * e.g.
 *     var config = require('appconfig');
 *     var first = config.user();		// should be the real value
 *     var second = config.user();		// should be undefined
 */
exports.user = oneTime(access.user);
exports.pass = oneTime(access.pass);
