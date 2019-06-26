'use strict';

const urlParse = require('url-parse');

/**
 * Add SPA navigation listener to links
 * @function
 * @param {object} anchorTagsContainer -- node that has anchor tag children
 */
function apply(anchorTagsContainer) {
  // Attach vue router listener on SPA links that are not opening in a new tab/window.
  const anchorTags = anchorTagsContainer.querySelectorAll('a.spa-link:not([target="_blank" i]');

  if (anchorTags) {
    anchorTags.forEach(anchor => {
      anchor.addEventListener('click', event => {
        event.preventDefault();
        anchor.removeEventListener('click', anchor.fn, false);
        let link = anchor.getAttribute('href'),
          path;

        if (!link.includes('http')) {
          link = window.location.protocol + link;
        }
        path = urlParse(link).pathname;
        navigateTo(path);
      });
    });
  }
}

/**
 * Navigate to path in SPA
 * @function
 * @param {string} path
 */
function navigateTo(path) {
  // eslint-disable-next-line no-undef
  vueApp._router.push(path || '/');
}

module.exports.apply = apply;
module.exports.navigateTo = navigateTo;
