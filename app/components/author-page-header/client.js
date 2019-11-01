'use strict';

const getRightRail = (el) => {
  const layoutPageHeader = document.querySelector('.layout__page-header'),
    moreContentRightRail = document.querySelector('.more-content-feed__right-rail'),
    authorPageHeaderRightRail = el.querySelector('.author-page-header__right-content');

  layoutPageHeader.style['z-index'] = 4;

  authorPageHeaderRightRail.appendChild(moreContentRightRail);
};

module.exports = getRightRail;
