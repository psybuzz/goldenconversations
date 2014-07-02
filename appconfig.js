/**
 * Golden Secrets.
 *
 * IMPORTANT: This file contains very sensitive information. It should never be included in git,
 * exposed to GitHub or any version control service, or shared with anyone outside. If this file
 * happens to fall into the wrong hands, the security of our data operations become compromised.
 *
 * This file holds extremely sensitive information related to the application, including database
 * access information.
 *
 * Sources:
 * https://gist.github.com/adrianbravo/1233693
 */

var crypto = require('crypto');

// Reset 'undefined'.
var obj = {};
undefined = obj.x;

// Secrets.
var salt = '#td4w';
var access = {
	user: 'goldenconversations',
	pass: 'ther3aljrr'
};

// Expose one-time use values.
var oneTime = function(value){
	var used = false;

	return {
		decipher: function(){
			if (used === false){
				used = true;
				return value;
				// return decipher+decipher.final('utf8');
			}
		}
	};
}
exports.userDecipher = oneTime(access.user);
exports.passDecipher = oneTime(access.pass);

// TODO(erik): use crryptography to pass back encrrypted keys, and try to avoid using plaintext.

// Create ciphers and deciphers.
var algorithm = 'aes-256-cbc';
var encoding = 'hex';

var userCipher = crypto.createCipher(algorithm, salt);
var userDecipher = crypto.createDecipher(algorithm, salt);

var passCipher = crypto.createCipher(algorithm, salt);
var passDecipher = crypto.createDecipher(algorithm, salt);

userCipher.update(access.user, 'utf8', encoding);
passCipher.update(access.pass, 'utf8', encoding);

// Rewrite and erase secrets from memory in case server was hacked.
access = {
	user: 'fakeuser',
	pass: 'fakepass'
};
delete access.user;
delete access.pass;

// Expose the encrypted username and password.
exports.user = userCipher+userCipher.final(encoding);
exports.pass = passCipher+passCipher.final(encoding);

// Updated deciphers with encrypted username and password.
userDecipher.update(exports.user, 'utf8', encoding);
passDecipher.update(exports.pass, 'utf8', encoding);

// Rewrite the oneTimeDecipher function.
oneTimeDecipher = undefined;