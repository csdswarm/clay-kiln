'use strict';

function Constructor(galleryPage) {
  const sidebar = galleryPage.querySelector('.content__sidebar'),
    galleryBody = galleryPage.querySelector('.gallery__body');

  this.repositionRightRail(sidebar, galleryBody);
}

Constructor.prototype = {
  /**
   * Repositions the right rail under the gallery headline &
   * subheadline so that it is in line with the gallery body.
   * @function
   * @param {object} sidebar
   * @param {object} galleryBody
   */
  repositionRightRail: function (sidebar, galleryBody) {
    sidebar.style.marginTop = galleryBody.offsetTop + 'px';
    sidebar.style.position = 'relative';
    sidebar.style.visibility = 'visible';
  }
};

module.exports = (el) => new Constructor(el);
