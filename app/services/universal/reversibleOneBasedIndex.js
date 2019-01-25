/**
 *
 * Handlebars helper that converts a zero based index
 * to a 1 based index by simply adding 1 to the given index.
 *
 */

'use strict';

module.exports = function reversibleOneBasedIndex(index, reverseOrder, totalSlides) {
	if (reverseOrder) {
		return totalSlides - index;
	} else {
		return index + 1;
	}
};
