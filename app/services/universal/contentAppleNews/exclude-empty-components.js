'use strict';

/**
 * @param {Object|null} component apple news format component object
 * @returns {Bool}
 */
const { ANF_EMPTY_COMPONENT } = require('./constants'),
  isValidComponent = component => {
    if (component === ANF_EMPTY_COMPONENT) {
      return false;
    }

    const isTextComponent = 'text' in component;

    if (isTextComponent) {
      return typeof component.text === 'string'
        && component.text !== '';
    }

    return true;
  },
  /**
   * @param {Object} componentTree apple news format component object
   * @returns {Bool}
   */
  hasChildComponents = ({ components }) => Array.isArray(components),

  /**
   * Returns a component tree excluding empty components.
   * Values that are considered empty components are:
   *
   * - ANF components that have a text value of empty string or null
   * - null
   *
   * @param {Object} componentTree apple news format component object
   * @returns {Object} new component tree with empty components excluded
   */
  excludeEmptyComponents = (componentTree = {}) => {
    const { components } = componentTree;

    if (!hasChildComponents(componentTree)) {
      return componentTree;
    }

    // eslint-disable-next-line one-var
    const filteredComponents = components.reduce((filteredList, subTree) => {
      if (isValidComponent(subTree)) {
        filteredList.push(
          excludeEmptyComponents(subTree)
        );
      }

      return filteredList;
    }, []);

    return {
      ...componentTree,
      components: filteredComponents
    };
  };

module.exports = excludeEmptyComponents;
