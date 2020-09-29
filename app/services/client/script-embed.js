'use strict';

const _bindAll = require('lodash/bindAll'),
  { getComponentInstance,getComponentName } = require('clayutils');

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

class ScriptEmbed {
  /**
   * Creates an instance of ScriptEmbed and binds mounting events
   *
   * @param {HTMLElement} rootComponent
   * @memberof ScriptEmbed
   */
  constructor(rootComponent) {
    const uri = rootComponent.getAttribute('data-uri');

    this.rootComponent = rootComponent;
    this.componentName = getComponentName(uri);
    this.componentInstance = getComponentInstance(uri);
    _bindAll(this, 'onMount', 'onDismount');

    document.addEventListener(`${this.componentName}-mount`, this.onMount());
    document.addEventListener(`${this.componentName}-dismount`, this.onDismount());
  }

  /**
   * replace the embedded script
   *
   * @memberof ScriptEmbed
   */
  onMount() {
    const {
      componentName,
      componentInstance,
      rootComponent
    } = this;

    let oldWrite,
      count = 0;

    try {
      oldWrite = document.write;
  
      rootComponent.querySelectorAll('script').forEach((script) => {
        const newScript = duplicateScript(script),
          id = `script-${componentName}-${componentInstance}-${count++}`;
    
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
    } finally {
      document.write = oldWrite;
    }
  }

  /**
   * Remove the added listeners that won't be destroyed
   *
   * @memberof ScriptEmbed
   */
  onDismount() {
    const { componentName } = this;

    document.removeEventListener(`${componentName}-mount`, this.onMount);
    document.removeEventListener(`${componentName}-dismount`, this.onDismount);
  }
}

module.exports = (el) => new ScriptEmbed(el);
module.exports.duplicateScript = duplicateScript;
