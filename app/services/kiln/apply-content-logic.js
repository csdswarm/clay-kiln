'use strict';

/**
 * README
 *  - This encapsulates all kiln logic that happens for every (or most) content
 *    components.  The idea is to save boilerplate and make future content
 *    components easier to implement.
 */

const addStationNoteToCustomUrl = require('./add-station-note-to-custom-url'),
  handleEditModePlaceholders = require('./handle-edit-mode-placeholders'),
  {
    enforcePagePermissions,
    enforcePublishRights
  } = require('./permissions');

// these components require specific permissions to publish.  The other
//   content components restrict publishing based off station access.
const componentsToCheckPublishPermission = new Set([
    'static-page'
  ]),
  componentsToCheckUnpublishPermission = new Set([
    'homepage',
    'section-front',
    'static-page',
    'station-front'
  ]),
  componentsWithHardcodedUrls = new Set([
    'homepage',
    'station-front'
  ]),
  KilnInput = window.kiln.kilnInput;


module.exports = schema => {
  const { schemaName } = schema;

  if (!componentsWithHardcodedUrls.has(schemaName)) {
    addStationNoteToCustomUrl(new KilnInput(schema));
  }

  enforcePublishRights(schema, {
    checkStationAccessFor: {
      publish: !componentsToCheckPublishPermission.has(schemaName),
      unpublish: !componentsToCheckUnpublishPermission.has(schemaName)
    }
  });

  handleEditModePlaceholders(new KilnInput(schema));

  enforcePagePermissions(schema);
};
