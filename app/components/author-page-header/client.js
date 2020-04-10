'use strict';

const getRightRail = (el) => {
  const layoutPageHeader = document.querySelector('.layout__page-header'),
    rightColumn = document.querySelector('.two-column-component__column--2'),
    authorPageHeaderRightRail = el.querySelector('.author-page-header__right-content');

  if (authorPageHeaderRightRail && rightColumn) {
    layoutPageHeader.style['z-index'] = 4;

    authorPageHeaderRightRail.appendChild(rightColumn);
  }
};

module.exports = getRightRail;
