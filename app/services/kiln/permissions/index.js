'use strict';

const addPermissions = require('../../universal/user-permissions');

// kind of a hack, but NYMag does not have any early events where we can tie
//   into in order to automatically add this to the user object, so we are
//   accessing it directly off of the window
addPermissions(window.kiln.locals);

module.exports = {
  enforcePagePermissions: require('./enforce-page-permissions'),
  enforcePublishRights: require('./enforce-publish-rights'),
  secureAllSchemas: require('./secure-all-schemas'),
  simpleListRights: require('./simple-list-rights')
};
