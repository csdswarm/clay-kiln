'use strict';

/**
 * duplicates a script tag with data attributes
 *
 * @param {object} script a script tag object
 * @return {object} a script tag object
 */
const duplicateScript = (script) => {
  const newScript = document.createElement('script'),
    attributes = script.outerHTML.match(/([^\s]+)=/g).map(attr => attr.replace('=', ''));

  attributes.forEach((attribute) => newScript.setAttribute(attribute, script.getAttribute(attribute)));
  newScript.setAttribute('async', '');

  return newScript;
};

document.addEventListener('html-embed-mount', () => {
  let count = 0;

  document.querySelectorAll('.component--html-embed script').forEach((script) => {
    const newScript = duplicateScript(script),
      id = `html-embed-${count++}`;

    newScript.setAttribute('data-html-id', id);
    document.write = (html) => { document.querySelector(`script[data-html-id="${id}"]`).insertAdjacentHTML('beforeend', html); };

    script.replaceWith(newScript);
  });
});
