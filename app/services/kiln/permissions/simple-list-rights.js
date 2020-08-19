'use strict';

const KilnInput = window.kiln.kilnInput;

/**
 * mutates the schema blocking the user from being able to add/remove items from a simple-list if they do not have permissions
 *
 * @param {object} schema
 * @param {string} field
 * @param {string} [component]
 *
 * @return {object} - schema
 */
function simpleListRights(schema, field, component = schema.schemaName) {
  const subscriptions = new KilnInput(schema);

  subscriptions.subscribe('PRELOAD_SUCCESS', async ({ locals }) => {
    schema[field]._has.autocomplete.allowCreate = locals.user.isAbleTo('create').using(component).value;
    schema[field]._has.autocomplete.allowRemove = locals.user.isAbleTo('remove').using(component).value;
  });

  return schema;
}

module.exports = simpleListRights;
