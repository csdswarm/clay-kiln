'use strict';

const jsdom = require('jsdom'), // will be rewritten to `jsdom = false` on client
  createDOMPurify = require('dompurify'),
  dom = jsdom ? new jsdom.jsdom('', {
    features: {
      FetchExternalResources: false, // disables resource loading over HTTP / filesystem
      ProcessExternalResources: false // do not execute JS within script blocks
    }
  }).window : window;

// Sanitizes HTML to prevent XSS attacks; see https://github.com/cure53/DOMPurify
module.exports = createDOMPurify(dom).sanitize;
