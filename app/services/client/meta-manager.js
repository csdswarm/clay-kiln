/**
 *
 * Meta Manager
 *
 * This service is used to manage meta tag updates during SPA navigation.
 *
 */

'use strict';

class MetaManager {

  extractComponentDataFromComponentList(componentList, componentName) {
    return componentList.find((component) => {
      const regEx = new RegExp(`\_components\/${componentName}\/instances`);

      return regEx.test(component['_ref']);
    });
  }

  updateTitleTag(newTitle) {

    const title = document.head.querySelector('title');

    title.textContent = newTitle;

  }

  updateMetaTag(attributeType, attributeKey, content) {

    if (attributeType !== 'property' && attributeType !== 'name') {
      throw new Error('invalid meta tag attribute.');
    }

    document.head.querySelector(`meta[${attributeType}='${attributeKey}']`).setAttribute('content', content);
  }

}

module.exports = () => {
  return new MetaManager();
};
