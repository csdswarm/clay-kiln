'use strict';

/**
 * Add SPA navigation listener to links
 * @function
 * @param {object} selector
 */
function apply(selector) {
  // Attach vue router listener on SPA links.
  selector.addEventListener('click', event => {
    event.preventDefault();
    selector.removeEventListener('click', selector.fn, false);
    const linkParts = new URL(selector.getAttribute('href'));

    // eslint-disable-next-line no-undef
    vueApp._router.push(linkParts.pathname || '/');
  });
}

module.exports = apply;
