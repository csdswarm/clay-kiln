'use strict';

const getRightRail = (el, component = 'author') => {
  const layoutPageHeader = document.querySelector('.layout__page-header'),
    rightColumn = document.querySelector('.two-column-component__column--2'),
    pageHeaderRightRail = el.querySelector(`.${component}-page-header__right-content`);

  if (pageHeaderRightRail && rightColumn) {
    layoutPageHeader.style['z-index'] = 4;

    pageHeaderRightRail.appendChild(rightColumn);
  }
};

module.exports = getRightRail;
