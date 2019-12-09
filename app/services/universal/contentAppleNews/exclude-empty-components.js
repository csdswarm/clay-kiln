'use strict';

const { isEmptyComponent } = require('./utils'),
  /**
   * Checks validity of component
   *
   * @param {Object} component apple news format component object
   *
   * @returns {Bool}
   */
  isValidComponent = component => {
    if (isEmptyComponent(component)) {
      return false;
    }

    const isTextComponent = component.hasOwnProperty('text');

    if (isTextComponent) {
      return typeof component.text === 'string'
        && component.text !== '';
    }

    return true;
  },
  /**
   * Checks if component has child components
   *
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

    return {
      ...componentTree,
      components: components.filter(isValidComponent)
        .map(excludeEmptyComponents)
    };
  };

module.exports = excludeEmptyComponents;
