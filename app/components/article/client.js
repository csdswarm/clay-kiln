'use strict';

function Constructor() {
  const sidebar = document.getElementsByClassName('content__sidebar')[0],
    articleBody = document.getElementsByClassName('article__body')[0],
    logoSponsorship = document.querySelector('.google-ad-manager--content-page-logo-sponsorship');

  this.repositionRightRail(sidebar, articleBody);
  setTimeout(() => {
    if (logoSponsorship.clientHeight === 0) {
      this.repositionRightRail(sidebar, articleBody);
    }
  }, 3000);
}

Constructor.prototype = {
  /**
   * Repositions the right rail under the article headline &
   * subheadline so that it is in line with the article body.
   * @function
   * @param {object} sidebar
   * @param {object} articleBody
   */
  repositionRightRail: function (sidebar, articleBody) {
  	sidebar.style.marginTop = articleBody.offsetTop + 'px';
  	sidebar.style.position = 'relative';
  	sidebar.style.visibility = 'visible';
  }
};

module.exports = () => new Constructor();
