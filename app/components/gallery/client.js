'use strict';

function Constructor() {
  const sidebar = document.getElementsByClassName('content__sidebar')[0],
    galleryBody = document.getElementsByClassName('gallery__body')[0];

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

module.exports = () => new Constructor();
