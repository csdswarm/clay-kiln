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
  newScript.async = true;

  return newScript;
};

document.addEventListener('html-embed-mount', () => {
  document.querySelectorAll('.component--html-embed script').forEach((script) => {
    const newScript = duplicateScript(script);

    document.write = (html) => { newScript.outerHTML += html; };

    script.replaceWith(newScript);
  });
});
