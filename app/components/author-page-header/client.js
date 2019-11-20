'use strict';

const getRightRail = (el) => {
  const layoutPageHeader = document.querySelector('.layout__page-header'),
    moreContentRightRail = document.querySelector('.component--more-content-feed-right-rail'),
    authorPageHeaderRightRail = el.querySelector('.author-page-header__right-content');

  if (moreContentRightRail) {
    layoutPageHeader.style['z-index'] = 4;

    authorPageHeaderRightRail.appendChild(moreContentRightRail);
  }
};

module.exports = getRightRail;
