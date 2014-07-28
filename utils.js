// Nice little utility functions.

/**
 * Returns the union of two arrays by merging them and de-duplicating the contents.
 *
 * If only one array is passed in, 
 *
 * @param {Arrays}
 * OR
 * @param {Array}
 * @param {Function} mapping function to hash with.  Useful for de-duplication:
 *      e.g. 
 */
exports.union = function () {
	var args = Array.prototype.slice.call(arguments, 0);
	hash = {};
	union = [];

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
}