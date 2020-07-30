'use strict';

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

document.addEventListener('html-embed-mount', () => {
  let count = 0;

  document.querySelectorAll('.component--html-embed script').forEach((script) => {
    const newScript = duplicateScript(script),
      id = `html-embed-${count++}`;

    newScript.setAttribute('data-html-id', id);
    document.write = (html) => { document.querySelector(`script[data-html-id="${id}"]`).insertAdjacentHTML('afterend', html); };

    newScript.appendChild(document.createTextNode(script.innerHTML));
    script.parentNode.replaceChild(newScript, script);
  });
});

module.exports = duplicateScript;
