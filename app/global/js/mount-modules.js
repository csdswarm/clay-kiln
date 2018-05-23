'use strict';

// Required and executed by view-after.js

const _ = require('lodash');

/**
 * Mount all megabundle modules on the page.
 */
function mountModules() {
  const modules = window.modules;

  // Mount global services first
  Object.keys(modules)
    .filter(moduleId => _.endsWith(moduleId, '.service'))
    // Require each service, executing anything outside its export
    // (e.g. Dollar Slice registration)
    .forEach(moduleId => window.require(moduleId));

  // Mount components
  Object.keys(modules)
    .filter(moduleId => _.endsWith(moduleId, '.client'))
    .forEach(mountComponentModule);
}

/**
 * Mount a specified component module.
 * @param  {string} moduleName e.g. 'article.client'
 */
function mountComponentModule(moduleName) {
  const cmptModule = window.require(moduleName);

  if (typeof cmptModule === 'function') {
    const cmptName = moduleName.replace('.client', ''),
      selector = `[data-uri*="_components/${cmptName}"]`,
      els = document.querySelectorAll(selector);

    for (let el of els) {
      try {
        cmptModule(el);
      } catch (err) {
        logMountError(el, err);
      }
    }
  }
}

/**
 * Log an error mounting the client script for the specified element.
 * @param  {HtmlElement} el
 * @param  {Error} error
 */
function logMountError(el, error) {
  // element tag will be the full contents of the component's tag such as:
  // <div data-uri="nymag.com/selectall/_components/ad-recirc/instances/article@published" class="ad-recirc" data-placeholder="title" data-delay="3.5" data-disable-recirc="">
  const elementTag = el.outerHTML.slice(0, el.outerHTML.indexOf(el.innerHTML));

  console.error('Error attaching controller to ' + elementTag, error);
}

module.exports = () => mountModules();
