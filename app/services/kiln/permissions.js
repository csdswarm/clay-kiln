'use strict';

const addPermissions = require('../universal/user-permissions'),
  identity = require('lodash/identity'),
  noop = require('lodash/noop');

// kind of a hack, but NYMag does not have any early events where we can tie into in order to automatically add
// this to the user object, so we are accessing it directly off of the window
addPermissions(window.kiln.locals);

module.exports = {
  enforcePublishRights: noop,
  secureAllSchemas: noop,
  secureField: noop,
  secureSchema: noop,
  simpleListRights: identity
};
