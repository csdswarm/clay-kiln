'use strict';

// export all internal functions so they can be tested individually
module.exports = {
  autoLink,
  _internal:{
    slugify,
    toLinkSegments,
    toFullLinks,
    concatValues
  }
};


/**
 * Automatically creates links based on data in the provided list of properties on the data context
 * @param {Object} data the data context
 * @param {string[]} props list of properties on data to generate links from
 * @param {string} host the hostname of the site
 * @returns {{text: string, url: string}[]} An array of link objects
 */
function autoLink(data, props, host) {
  const onlyExistingItems = prop => data[prop];

  return props
    .filter(onlyExistingItems)
    .map(toLinkSegments(data))
    .map(toFullLinks(host));
}

/**
 * Takes a text value and converts it to a navigable slug
 * @param {string} value the value to convert to a slug
 * @returns {string} a new url-friendly slug
 */
function slugify(value) {
  const cleanValue = value
    .toLocaleLowerCase()
    .trim()
    .replace(/ /g, '-');

  return encodeURIComponent(cleanValue);
}

/**
 * Returns a function intended to use with an Array.prototype.map method to convert a value of a data object specified
 * by `prop` into an object containing {text, segment}
 * @param {Object} data a context object
 * @returns {function(string): {segment: string, text: string}}
 * @example
 * // returns a function that takes a property name as its only argument
 * toLinkSegments({p1:'stuff', myProp:'One & Two/Thirds'});
 */
function toLinkSegments(data) {
  /**
   * Used to map properties of data as an object containing the text to show in a link and it's slug
   * @param {string} prop the name of the property to check
   * @returns {{segment: string, text: string}} segment is the slug
   * @example
   * const toSegments = toLinkSegments({p1:'stuff', myProp:'One & Two/Thirds'});
   * // returns {segment: 'one-%26-two%2Fthirds', text: 'One & Two/Thirds'}
   * toSegments('myProp')
   */
  return prop => {
    const text = data[prop];

    return {segment: slugify(text), text };
  };
}

/**
 * Returns a function intended to use with an Array.prototype.map method that converts a list of {text, segment}
 * objects into {text, url} objects
 * @param {string} host the hostname to prepend to the resulting link
 * @returns {function({text: string}, number, Object[]): {text: string, url: string}} A function that creates a link
 * @example
 * // returns a function to use for mapping an array
 * const makeFullLink = toFullLinks('clay.radio.com');
 */
function toFullLinks(host) {
  /**
   * Used to map a list of objects in the form of {segment, text} to the form {link, text}, where link is
   * the hostname plus all segments concatenated together
   * @param {string} text the text of the link
   * @param {number} index the current index of the mapping
   * @param {{segment: string, text: string}[]} segments the entire array of segments
   * @returns {{text: string, url: string}} the text and full url for each item in the segments array
   * @example
   * const makeFullLink = toFullLinks('clay.radio.com');
   * const arr = [{segment: 'first', text: 'First'},{segment: 'second', text: 'Second'}];
   * // returns {url: '//clay.radio.com/first/second', text: 'Second'}
   * makeFullLink(arr[1], 1, arr);
   */
  return ({text}, index, segments) => ({
    url: `//${host}/${concatValues(segments.slice(0, index + 1), 'segment')}`,
    text
  });
}

/**
 * Takes an array of objects and concatenates the `prop` value of each object with the `separator` provided
 * @param {Object[]} arr an array of objects. NOTE: must include a property with name that matches `prop`.
 * @param {string} prop the name of the property of each object of the array to concatenate
 * @param {string|'/'} separator the separator to use
 * @returns {string} All prop values of the object array concatenated with the separator into a single string
 * @example
 * // returns 1,3,4
 * concatValues([{a:1, b:2}, {a:3}, {a:4, c:5}], 'a', ',')
 */
function concatValues(arr, prop, separator = '/') {
  return arr.map(item => item[prop]).join(separator);
}
