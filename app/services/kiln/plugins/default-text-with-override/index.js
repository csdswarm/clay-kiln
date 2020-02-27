'use strict';

/**
 * A text input with override functionality for a good UX.  I built this because
 *   I couldn't figure out a good UX to cover this case using kiln's
 *   builtin inputs.
 */

const _set = require('lodash/set'),
  DefaultTextWithOverride = require('./input.vue');

// Register plugin.
module.exports = () => {
  _set(
    window,
    'kiln.inputs.default-text-with-override',
    DefaultTextWithOverride
  );
};
