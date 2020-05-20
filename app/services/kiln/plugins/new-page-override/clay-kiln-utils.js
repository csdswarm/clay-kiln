'use strict';

/**
 * README
 *  - this file exists because I need functionality from clay-kiln source that
 *    isn't published.  Each function will list where it exists in the v8.13.0
 *    source code.
 */

// lib/utils/urls.js: line 3
const _each = require('lodash/each'),
  _head = require('lodash/head'),
  _isObject = require('lodash/isObject'),
  _sortBy = require('lodash/sortBy'),
  localforage = require('localforage'),
  protocolPattern = /^((http|https):\/\/)/;

// lib/utils/local.js: line 9
localforage.config({
  name: 'kiln:kiln',
  description: 'Local browser store for Kiln, using localForage'
});

/**
 * add port to uri if it needs it
 * lib/utils/urls.js: line 11
 * @param {string} uri
 * @param {object} [location] to stub for testing
 * @returns {string}
 */
function addPort(uri, location) {
  location = location || /* istanbul ignore next: can't stub window.location */ window.location;

  // hostname doesn't have port, but host does.
  // so remove the port (if it exists) to normalize it, then add it back in (if it exists)
  return uri.replace(location.host, location.hostname).replace(location.hostname, location.host);
}

/**
* Check url string for protocol and if it doesn't have one, add the protocol of the current url
* lib/utils/urls.js: line 25
* @param {string} url
* @param {object} location - only passed in testing
* @return {string}
*/
function addProtocol(url, location) {
  if (!protocolPattern.test(url)) {
    location = location || /* istanbul ignore next: can't stub window.location */ window.location;

    url = `${location.protocol}//${url}`;
  }

  return url;
}

/**
 * convenience function to add port and protocol to uris
 * lib/utils/urls.js: line 41
 * @param {string} uri
 * @param {object} [location] to stub for testing (or to generate url for a different site)
 * @returns {string}
 */
module.exports.uriToUrl = (uri, location) => {
  location = location || /* istanbul ignore next: can't stub window.location */ window.location;

  return addProtocol(addPort(uri, location), location);
};

// lib/utils/references.js: line 108
module.exports.editExt = '?edit=true';

// lib/utils/references.js: line 107
module.exports.htmlExt = '.html';

// lib/utils/references.js: line 75, 96, 107 and 108 respectively
module.exports.refProp = '_ref';
module.exports.pagesRoute = '/_pages/';
module.exports.htmlExt = '.html';
module.exports.editExt = '?edit=true';

/**
 * when fetching or updating pages, make sure they're sorted
 * note: this will also place them into a General category if they don't currently have categories
 * lib/lists/helpers.js: line 119
 * @param  {array} items
 * @return {array}
 */
module.exports.sortPages = items => {
  if (!items || !_isObject(_head(items)) || !_head(items).children) {
    // no categories, so put all pages in a General category before rendering them
    items = [{
      id: 'general',
      title: 'General',
      children: _sortBy(items, ['title', 'id'])
    }];
  } else {
    // categories are already set up, so sort them and their children
    // note: we're doing this every time to take into account bootstraps and manual changes to the new-pages list
    items = _sortBy(items, ['title', 'id']);
    _each(items, (item) => {
      item.children = _sortBy(item.children, ['title', 'id']);
    });
  }

  return items;
};

/**
 * sets a key to the value in localforage and returns a promise of that value
 * https://localforage.github.io/localForage/#data-api-setitem
 * lib/utils/local.js: line 19
 * @param {*} key
 * @param {*} val
 * @returns {Promise<*>}
 */
module.exports.setItem = (key, val) => localforage.setItem(key, val);
