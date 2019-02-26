'use strict';

/**
 * Add SPA navigation listener to links
 * @function
 * @param {object} selector
 */
function apply(selector) {
  // Attach vue router listener on SPA links.
  const anchorTags = selector.querySelectorAll('a.spa-link');

  anchorTags.forEach(anchor => {
    anchor.addEventListener('click', event => {
      event.preventDefault();
      anchor.removeEventListener('click', anchor.fn, false);
      const linkParts = new URL(window.location.protocol + anchor.getAttribute('href'));

      // eslint-disable-next-line no-undef
      vueApp._router.push(linkParts.pathname || '/');
    });
  });
}

module.exports = apply;
