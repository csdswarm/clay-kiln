'use strict';

/**
 * README
 *  - this file contains utilities for the dom which have server counterparts.
 *    It's necessary because we don't always want to bundle large dependencies
 *    when the browser has the functionality we need built in.
 */

const api = {},
  createDOMPurify = require('dompurify');

api.DOMParser = DOMParser;

// Sanitizes HTML to prevent XSS attacks; see https://github.com/cure53/DOMPurify
api.purify = createDOMPurify(window).sanitize;

module.exports = api;
