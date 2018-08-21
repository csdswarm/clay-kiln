/**
 * 
 * Handlebars helper that attaches the full handlerbars context to the browser window object for use by a front-end SPA.
 * 
 */

 'use strict';

module.exports = function attachSpaPayloadToWindow(context) {

  let payload = null;

  // If no context is provided to helper, it defaults to context pointing towards the full helper object.
  // This can be determined by the name property.
  if (context.name && context.name == 'attachSpaPayloadToWindow') {
    payload = JSON.stringify(context.data.root);
  } else {
    payload = JSON.stringify(context);
  }

  // @TODO: Undo once solution is found for import/export vs require bug in webpack
  return payload;

}