/**
 *
 * Handlebars helper that converts a zero based index
 * to a 1 based index by simply adding 1 to the given index or
 * returns the index subtracted from total count of slides
 * to get a reverse numbering effect.
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
