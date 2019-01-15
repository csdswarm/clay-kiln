'use strict';

function Constructor() {
  const sidebar = document.querySelector('.content__sidebar'),
    galleryBody = document.querySelector('.gallery__body'),
    firstInlineAd = document.querySelector('.slides__ad-container');

  this.repositionRightRail(sidebar, galleryBody);
  if (firstInlineAd) {
    window.addEventListener('scroll', function() { this.hideTertiaryStickyAd(); }.bind(this) );
  }
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
  },
  /**
   * Hide tertiary sticky ad after user scrolls past the first inline ad
   * so that it does not show up behind the inline right rail ads.
   * @function
   */
  hideTertiaryStickyAd: function () {
    const firstStickyAd = document.querySelector('.content__sidebar .sticky'),
      firstInlineAd = document.querySelector('.slides__ad-container');

    if (window.scrollY > firstInlineAd.offsetTop) {
      if (firstStickyAd.style.visibility !== 'hidden') {
        firstStickyAd.style.visibility = 'hidden';
      }
    } else {
      if (firstStickyAd.style.visibility !== 'visible') {
        firstStickyAd.style.visibility = 'visible';
      }
    }
  }
};

module.exports = () => new Constructor();
