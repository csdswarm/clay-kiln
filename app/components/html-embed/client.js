'use strict';
const _bindAll = require('lodash/bindAll');


/**
 * duplicates a script tag with data attributes
 *
 * @param {object} script a script tag object
 * @return {object} a script tag object
 */
const duplicateScript = (script) => {
  const newScript = document.createElement('script');

  Array.from(script.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
  newScript.setAttribute('async','');

  return newScript;
};

/**
 *
 *
 * @class HTMLEmbed
 */
class HTMLEmbed {
  /**
   * Creates an instance of PodcastShowPage and binds mounting events
   * @memberof HTMLEmbed
   */
  constructor() {
    _bindAll(this, 'onMount', 'onDismount');
    document.addEventListener('html-embed-mount', this.onMount);
    document.addEventListener('html-embed-dismount', this.onDismount);
  }
  /**
   * add refs and setup tabs
   *
   * @param {Event} e
   * @memberof HTMLEmbed
   */
  // eslint-disable-next-line no-unused-vars
  onMount(el) {
    let count = 0;

    document.querySelectorAll('.component--html-embed script').forEach((script) => {
      const newScript = duplicateScript(script),
        id = `html-embed-${count++}`;
  
      newScript.setAttribute('data-html-id', id);
      document.write = (html) => { document.querySelector(`script[data-html-id="${id}"]`).insertAdjacentHTML('afterend', html); };
  
      newScript.appendChild(document.createTextNode(script.innerHTML));
      script.parentNode.replaceChild(newScript, script);
    });

    const isASectionOrStationFront = document.querySelector('.component--section-front, .component--station-front');

    if (isASectionOrStationFront) {
      document.querySelectorAll('.two-column-component__column--2 .iframe-container__padded-container').forEach((embed) => {
        embed.children.forEach(elem => {
          elem.style.width ? elem.style.width = 'auto' : null;
        });
      });
    }
  }
  /**
   * Remove the added listeners that won't be destroyed
   *
   * @memberof HTMLEmbed
   */
  onDismount() {
    document.removeEventListener('html-embed-mount', this.onMount);
    document.removeEventListener('html-embed-dismount', this.onDismount);
  }
}

module.exports = el => new HTMLEmbed(el);
module.exports.duplicateScript = duplicateScript;
