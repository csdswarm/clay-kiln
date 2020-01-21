'use strict';

/**
 * README
 *  - see client/dom-utils.js for an explanation of why these files exist.
 */

const { jsdom } = require('jsdom'),
  createDOMPurify = require('dompurify'),
  api = {},
  doc = jsdom('', {
    features: {
      FetchExternalResources: false, // disables resource loading over HTTP / filesystem
      ProcessExternalResources: false // do not execute JS within script blocks
    }
  });

api.DOMParser = doc.defaultView.DOMParser;

// Sanitizes HTML to prevent XSS attacks; see https://github.com/cure53/DOMPurify
api.purify = createDOMPurify(doc.defaultView).sanitize;

module.exports = api;
