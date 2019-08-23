'use strict';

const addPermissions = require('../universal/permissions'),
  KilnInput = window.kiln.kilnInput,
  _camelCase = require('lodash/camelCase'),
  /**
   * mutates the schema blocking the user from being able to publish if they do not have permissions
   *
   * @param {object} schema
   */
  publishRights = (schema) => {
    const subscriptions = new KilnInput(schema);

    subscriptions.subscribe('PRELOAD_SUCCESS', async ({ locals }) => {
      addPermissions(locals.user);

      const { value, message } = locals.user.can('publish').an(schema.schemaName).at(locals.station.callsign);

      if (!value) {
        const name = _camelCase(message);

        // using the name the message, it will display the message in the error list
        schema[name] = new KilnInput(schema, name);
        schema[name].setProp('_has', {
          ...schema[name]['_has'],
          input: 'text',
          validate: {
            required: true
          }
        });
        schema[name].hide();
      }
    });
  };

module.exports.publishRights = publishRights;
