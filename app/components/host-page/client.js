'use strict';

const getRightRail = (el) => {
  const layoutPageHeader = document.querySelector('.layout__page-header'),
    rightColumn = document.querySelector('.two-column-component__column--2'),
    hostPageHeaderRightRail = el.querySelector('.host-page__right-content');

  if (hostPageHeaderRightRail && rightColumn) {
    layoutPageHeader.style['z-index'] = 4;

    hostPageHeaderRightRail.appendChild(rightColumn);
  }
};

module.exports = getRightRail;
