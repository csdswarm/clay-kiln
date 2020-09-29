'use strict';

const _get = require('lodash/get'),
  _isEmpty = require('lodash/isEmpty'),
  _pick = require('lodash/pick'),
  log = require('../../universal/log').setup({ file: __filename }),
  { whenPreloaded } = require('./utils');

const KilnInput = window.kiln.kilnInput;

/**
 * Check if a kiln.js file exists for a component, provide default function if not
 *
 * @param {string} component
 * @returns {function} kilnjs
 */
function getKilnJs(component) {
  let kilnjs;

  try {
    kilnjs = require(`${component}.kiln`);
  } catch (e) {
    kilnjs = schema => schema;
  }

  return kilnjs;
}

/**
 * Default hide a field and watch for load success to check user permissions
 *
 * Permission can be a string, or an object with an action and target
 *
 * Use to secure a field within a kiln.js file
 *
 * @param {KilnInput} fieldInput
 * @param {string|object} permission
 * @param {string} component
 */
async function secureField(fieldInput, permission, component) {
  try {
    const { user } = await whenPreloaded(fieldInput),
      disableInput = !user.may(permission, component).value;

    if (disableInput) {
      fieldInput.setProp('disabled', true);
    }
  } catch (err) {
    log('error', `error when securing the field '${fieldInput.inputName}' for component '${component}'`, err);
  }
}

/**
 * Map through schema fields, find fields with permissions, and secure them
 * Then apply function from kiln.js
 *
 * Use to secure an entire schema with one permission from a kiln.js file
 *
 * @param {function} kilnjs
 * @param {string} componentName
 * @returns {function} secureKilnJs
 */
function secureSchema(kilnjs, componentName) {
  return schema => {
    const schemaUpdatePermissions = _pick(schema._permission, 'update');

    Object.keys(schema).forEach(field => {
      const fieldPermission = schema[field]._permission;

      if (
        _get(fieldPermission, '_has')
        || _get(schema._permission, '_has')
      ) {
        console.warn(`The ${schema.schemaName} component was upgraded causing the _permission to become corrupted.`,
          `Upgrade the /app/components/${schema.schemaName}/schema.yml to enable permissions.`);
      } else if (
        fieldPermission
        || (
          !_isEmpty(schemaUpdatePermissions)
          && schema[field]._has
        )
      ) {
        const permission = fieldPermission || schemaUpdatePermissions;

        schema[field] = new KilnInput(schema, field);

        secureField(schema[field], permission, componentName);
      }
    });

    return kilnjs(schema);
  };
}

/**
 * Add a default kilnjs file in componentKilnJs for all components
 * If a kiln.js file already exists, wrap it with secured version
 *
 * Secures every field with a _permissions field in the schema.yml
 */
function secureAllSchemas() {
  window.kiln = window.kiln || {};
  window.kiln.componentKilnjs = window.kiln.componentKilnjs || {};

  _get(window.kiln.locals, 'components', [])
    .forEach(component => {
      const kilnjs = getKilnJs(component);

      window.kiln.componentKilnjs[component] = secureSchema(kilnjs, component);
    });
}

module.exports = secureAllSchemas;
