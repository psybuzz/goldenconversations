// Nice little utility functions.
var validator = require('validator');

/**
 * Returns the union of two arrays by merging them and de-duplicating the contents.
 * Useful for ensuring there are no duplicate entries in a list.
 *
 * Example uses:
 * Utils.union([1,1,2,3], [3,4,5], [1,5,7])		// should return [1,2,3,4,5,7]
 * 
 * Utils.union({x: 1, y:2}, {x:50, y:2}, {z:5, y:3}, function(e){return e.y})	// compare using 'y'
 * // should return [{x:1, y:2}, {z:5, y:3}]
 *
 * @param {Arrays}
 * OR
 * @param {Array}
 * @param {Function} mapping function to hash with.
 */
exports.union = function () {
	var args = Array.prototype.slice.call(arguments, 0);
	var hash = {};
	var union = [];

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
};

/**
 * Returns a cleaned array without null or undefined entries.
 *
 * e.g. Utils.denullify([1,2,undefined,3,null])		// should return [1,2,3]
 *
 * @param {Array} a list of entries, some of which may be null or undefined.
 */
exports.denullify = function (list){
	var cleanList = [];
	for (var i = 0; i < list.length; i++){
		if (list[i] !== null && typeof list[i] !== 'undefined'){
			cleanList.push(list[i]);
		}
	}

	return cleanList;
}

/**
 * Sanitizes all fields within the property of an object using the validator node module.
 *
 * e.g. Utils.escape(req.body)		// req.body.id, req.body.username, ... are all escaped.
 *
 * BEFORE - req.body.username === "Mr. Dangerous <script>!";
 * AFTER - req.body.username === "Mr.%20Dangerous%20%3Cscript%3E!";
 */
exports.escape = function (dirtyObj){
	for (prop in dirtyObj){
		if (dirtyObj.hasOwnProperty(prop)){
			dirtyObj[prop] = validator.escape(dirtyObj[prop]);
		}
	}
}
