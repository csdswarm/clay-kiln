'use strict';

/**
 * README
 *  - This encapsulates all kiln logic that happens for every (or most) content
 *    components.  The idea is to save boilerplate and make future content
 *    components easier to implement.
 */

const addStationNoteToCustomUrl = require('./add-station-note-to-custom-url'),
  { enforcePublishRights } = require('./permissions'),
  handleEditModePlaceholders = require('./handle-edit-mode-placeholders'),
  KilnInput = window.kiln.kilnInput,
  // these components require specific permissions to publish.  The other
  //   content components restrict publishing based off station access.
  componentsToCheckPublishPermission = new Set([
    'static-page'
  ]),
  componentsToCheckUnpublishPermission = new Set([
    'homepage',
    'section-front',
    'static-page'
  ]);

module.exports = schema => {
  addStationNoteToCustomUrl(new KilnInput(schema));
  enforcePublishRights(schema, {
    checkStationAccessFor: {
      publish: !componentsToCheckPublishPermission.has(schema.schemaName),
      unpublish: !componentsToCheckUnpublishPermission.has(schema.schemaName)
    }
  });
  handleEditModePlaceholders(new KilnInput(schema));
};
