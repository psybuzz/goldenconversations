// Nice little utility functions.

/**
 * Returns the union of two arrays by merging them and de-duplicating the contents.
 *
 * @param {Arrays}
 */
exports.union = function () {
	hash = {};
	union = [];

	for (var arg = 0; arg < arguments.length; arg++) {
		for (var i = 0, len = arguments[arg].length; i < len; i++) {
			var item = arguments[arg][i];
			if (hash[item] !== true){
				hash[item] = true;
				union.push(item);
			}
		}
	}

	return union;
}