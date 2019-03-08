'use strict';

/**
 * Add SPA navigation listener to links
 * @function
 * @param {object} anchorTagsContainer -- node that has anchor tag children
 */
function apply(anchorTagsContainer) {
  // Attach vue router listener on SPA links.
  const anchorTags = anchorTagsContainer.querySelectorAll('a.spa-link');

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
        path = new URL(link).pathname;
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
