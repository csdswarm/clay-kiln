'use strict';

const _bindAll = require('lodash/bindAll'),
  { getComponentName } = require('clayutils');

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
 * @class ScriptEmbed
 */
class ScriptEmbed {
  /**
   * Creates an instance of ScriptEmbed and binds mounting events
   * @param {HTMLElement} targetElement
   */
  constructor(targetElement) {
    const uri = targetElement.getAttribute('data-uri') || '';

    this.component = getComponentName(uri);
    _bindAll(this, 'onMount', 'onDismount');

    if (this.component) {
      document.addEventListener(`${this.component}-mount`, this.onMount);
      document.addEventListener(`${this.component}-dismount`, this.onDismount);
    }
  }

  /**
   * replace the embedded script
   *
   * @param {Event} e
   * @memberof ScriptEmbed
   */
  onMount() {
    let count = 0;

    document.querySelectorAll(`.component--${this.component} script`).forEach((script) => {
      const newScript = duplicateScript(script),
        id = `html-embed-${count++}`;
  
      newScript.setAttribute('data-html-id', id);

      document.write = (html) => {
        const currentScript = document.querySelector(`script[data-html-id="${id}"]`);
        
        if (currentScript) {
          currentScript.insertAdjacentHTML('afterend', html);
        }
      };

      newScript.appendChild(document.createTextNode(script.innerHTML));
      script.parentNode.replaceChild(newScript, script);
    });
  }

  /**
   * Remove the added listeners that won't be destroyed
   *
   * @memberof ScriptEmbed
   */
  onDismount() {
    document.removeEventListener('html-embed-mount', this.onMount);
    document.removeEventListener('html-embed-dismount', this.onDismount);
  }
}

module.exports = (el) => new ScriptEmbed(el);
module.exports.duplicateScript = duplicateScript;
