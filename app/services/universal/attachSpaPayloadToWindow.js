/**
 * 
 * Handlebars helper that attaches the full handlerbars context to the browser window object for use by a front-end SPA.
 * 
 */

'use strict';

const Base64 = require('js-base64').Base64;

module.exports = function attachSpaPayloadToWindow(context) {

  let jsonPayload = null;

  // If no context is provided to helper, it defaults to context pointing towards the full helper object.
  // This can be determined by the name property.
  if (context.name && context.name == 'attachSpaPayloadToWindow') {
    jsonPayload = JSON.stringify(context.data.root);
  } else {
    jsonPayload = JSON.stringify(context);
  }
  
  // Base64 encode payload to avoid XSS issues related to inline JS.
  const base64Payload = Base64.encode(jsonPayload);

  return base64Payload;

}