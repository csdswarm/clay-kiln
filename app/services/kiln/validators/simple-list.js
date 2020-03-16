'use strict';

const { getComponentName } = require('clayutils'),
  _startCase = require('lodash/startCase'),
  db = require('../../client/db'),
  /**
   * validates that all of the items in the component are in the existing list of items
   *
   * @param {array} components
   * @param {string} componentName
   * @param {string} field
   * @param {array} existingItems
   *
   * @return {array}
   */
  validateComponentsLists = (components, componentName, field, existingItems) => {
    return components.map(async ([uri, data]) => {
      const blockItems = [];

      data.items.forEach(({ text }) => {
        if (!existingItems.includes(text)) {
          blockItems.push(text);
        }
      });

      if (blockItems.length) {
        return {
          uri,
          field,
          location: _startCase(componentName.replace(/-/g, ' ')),
          preview: blockItems.join(', ')
        };
      }
    });
  };

module.exports = {
  label: 'List Errors',
  description: 'The list contains unapproved items.',
  type: 'error',
  async validate({ components, locals }) {
    const listsToCheck = Object.keys(locals.componentPermissions._lists);
    let errors = [];

    for (const component of listsToCheck) {
      const componentList = locals.componentPermissions._lists[component],
        fieldsToCheck = Object.keys(componentList.field);

      for (const field of fieldsToCheck) {
        const create = componentList.field[field].create;

        // only check add permissions since remove should already be disabled
        if (!locals.user.hasPermissionsTo(create).this(component).value) {
          // grab the items on the page
          const listComponents = Object.entries(components)
              .filter(([uri]) => getComponentName(uri) === component),
            existingItems = (await db.get(`${process.env.CLAY_SITE_HOST}/_lists/${component}`, locals))
              .map(item => item.text);

          errors = errors.concat(await Promise.all(validateComponentsLists(listComponents, component, field, existingItems)));
        }
      }
    }

    return errors.filter(item => item);
  }
};
