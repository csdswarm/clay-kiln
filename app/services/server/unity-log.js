'use strict';

const { wrap } = require('clay-log/plugins/_utils');

// This is where your plug-in code will be defined. Anything in this block is
// executed **before** clay-log logs the message.
function wrapper(data, msg) {
  // Set up Datadog to get extra data natively
  if (msg instanceof Error) {
    data.error = {
      stack: msg.stack,
      kind: msg.name
    };
  } else if (typeof data === 'object' && data.hasOwnProperty('error') && data.error instanceof Error) {
    data.error = {
      stack: data.error.stack,
      kind: data.error.name,
      message: data.error.message
    };
  }
}

// The export of a plug-in will always use the format `wrap(<plug-in-func>, [<levels>])`.
// Omitting `[<levels>]` will apply the plug-in to all active log-levels.
module.exports = wrap(wrapper);
