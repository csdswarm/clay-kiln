'use strict';

/**
 * duplicates a script tag with data attributes
 *
 * @param {object} script a script tag object
 * @return {object} a script tag object
 */
const duplicateScript = (script) => {
  const newScript = document.createElement('script'),
    attributes = [].filter.call(script.attributes, at => /^data-/.test(at.name));

  attributes.forEach((attribute) => newScript.setAttribute(attribute.name, script.getAttribute(attribute.name)));
  newScript.type = 'text/javascript';
  newScript.charset = 'utf-8';
  newScript.async = true;
  newScript.src = script.src;

  return newScript;
};

document.addEventListener('html-embed-mount', () => {
  document.querySelectorAll('.component--html-embed script').forEach((script) => {
    const newScript = duplicateScript(script);

    document.write = (html) => { newScript.outerHTML += html; };
    script.replaceWith(newScript);
  });
});
