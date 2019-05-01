'use strict';



module.exports = {
  /**
   *
   * Adds events related to users
   *
   * @param {Document} doc
   * @param {Function} funcAdd
   * @param {Function} funcRemove
   *
   * @returns {Document} - document with events attached
   */
  addEventListener: (doc, funcAdd, funcRemove) => {
    // Attach favorite button click handlers
    doc.querySelectorAll('[data-fav-station]').forEach(element => {
      element.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const current = Array.from(element.classList).find((className) => className.match(/addFavorite/)) ? 'addFavorite' : 'removeFavorite',
          next = current === 'addFavorite' ? 'removeFavorite' : 'addFavorite',
          func = current === 'addFavorite' ? funcAdd : funcRemove;

        if (await func(element.dataset.favStation)) {
          element.classList.replace(current, next);
        }
      });
    });

    return doc;
  }
};
