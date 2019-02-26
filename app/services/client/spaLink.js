'use strict';

/**
 * Add SPA navigation listener to links
 * @function
 * @param {object} anchorTagsContainer -- node that has anchor tag children
 */
function apply(anchorTagsContainer) {
  // Attach vue router listener on SPA links.
  const anchorTags = anchorTagsContainer.querySelectorAll('a.spa-link');

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
