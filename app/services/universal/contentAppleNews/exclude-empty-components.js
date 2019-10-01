'use strict';

const isValidComponent = component => {
    const isTextComponent = 'text' in component;

    if (isTextComponent) {
      return typeof component.text === 'string'
        && component.text !== '';
    }

    return true;
  },
  hasChildComponents = ({ components }) => Array.isArray(components),

  /**
   * Returns a component tree excluding empty components (text is null or empty string).
   * This is needed because Apple news format does not allow text components
   * that have a `null` or `''` value.
   *
   * @param {Object} componentTree apple news format component object
   * @returns {Object} filtered list
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
