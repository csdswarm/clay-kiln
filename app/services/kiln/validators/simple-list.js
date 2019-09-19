'use strict';

const { getComponentName } = require('clayutils'),
  _startCase = require('lodash/startCase'),
  db = require('../../client/db'),
  listsToCheck = ['tags'],
  /**
   * validates that all of the items in the component are in the existing list of items
   *
   * @param {array} components
   * @param {string} componentName
   * @param {array} existingItems
   *
   * @return {array}
   */
  validateComponentsLists = (components, componentName, existingItems) => {
    return components.map(async ([uri, data]) => {
      let blockItems = [];

      data.items.forEach(({ text }) => {
        if (!existingItems.includes(text)) {
          blockItems.push(text);
        }
      });

      if (blockItems.length) {
        return {
          uri,
          location: _startCase(componentName.replace(/-/g, ' ')),
          preview: blockItems.join(', ')
        };
      }
    });
  };

module.exports = {
  label: 'List Errors',
  description: 'The list contain unapproved items.',
  type: 'error',
  async validate({ components, locals }) {
    let errors = [];

    for (const component of listsToCheck) {
      // only check add permissions since remove should already be disabled
      if (!locals.user.hasPermissionsTo('create').this(component)) {
        // grab the items on the page
        const listComponents = Object.entries(components)
            .filter(([uri]) => getComponentName(uri) === component),
          existingItems = (await db.get(`${process.env.CLAY_SITE_HOST}/_lists/${component}`, locals))
            .map(item => item.text);

        errors = errors.concat(await Promise.all(validateComponentsLists(listComponents, component, existingItems)));
      }
    }

    return errors.filter(item => item);
  }
};
