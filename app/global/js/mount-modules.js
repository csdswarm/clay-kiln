'use strict';

/**
 * THIS FILE IS OVERRIDING THE _client-init.js FILE PROVIDED IN node_modules/claycli/lib/cmd/compile/
 *
 * The default setup is that _client-init.js is put into public/js when running `claycli compile`
 */

// Required and executed by view-after.js

/**
 * Mount all megabundle modules on the page.
 */
function mountModules() {
  const modules = window.modules;

  // Mount components
  Object.keys(modules)
    .filter(moduleId => moduleId.endsWith('.client'))
    .forEach(mountComponentModule);
}

/**
 * Mount a specified component module.
 * @param  {string} moduleName e.g. 'article.client'
 */
function mountComponentModule(moduleName) {
  const cmptModule = window.require(moduleName);

  if (typeof cmptModule === 'function') {
    document.addEventListener('mount', () => {
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
    });
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

mountModules();
