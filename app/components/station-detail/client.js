'use strict';

function Constructor() {
  const sidebar = document.getElementsByClassName('content__sidebar')[0],
    stationDetail = document.querySelector('.component--station-detail'),
    tabs = stationDetail.querySelectorAll('.tabs li'),
    content = stationDetail.querySelectorAll('.tabbed-content__container'),
    hash = window.location.hash.replace('#', '');

  this.repositionRightRail(sidebar, stationDetail);
  this.addTabNavigationListeners(tabs, content);

  if (hash) {
    this.activateTab(hash, tabs, content, true);
    window.scrollTo(0, document.querySelector('.station-detail__body').offsetTop);
  }
  window.onpopstate = () => {
    if (window.location.hash) {
      this.activateTab(window.location.hash.replace('#', ''), tabs, content);
    } else {
      this.activateTab('recently-played', tabs, content);
    }
  };
}

Constructor.prototype = {
  /**
   * Add margin top to right rail
   * @function
   * @param {object} sidebar
   * @param {Element} stationDetail
   */
  repositionRightRail: function (sidebar, stationDetail) {
    sidebar.style.marginTop = window.getComputedStyle(stationDetail).marginTop;
    sidebar.style.visibility = 'visible';
  },
  /**
   * Add navigation listeners to tabs
   * @function
   * @param {NodeListOf} tabs
   * @param {NodeListOf} content
   */
  addTabNavigationListeners: function (tabs, content) {
    for (let tab of tabs) {
      tab.addEventListener('click', function (e) { this.activateTab(e, tabs, content, true); }.bind(this));
    }
  },
  /**
   * Navigate between tabs
   * @function
   * @param {object} e event or tab name
   * @param {NodeListOf} tabs
   * @param {NodeListOf} content
   * @param {boolean} [useHash]
   */
  activateTab: function (e, tabs, content, useHash) {
    let contentLabel;

    if (e.currentTarget) {
      contentLabel = e.currentTarget.classList[0].replace('tabs__','');

      for (let tab of tabs) {
        tab.classList.remove('active');
      }
      e.currentTarget.classList.add('active');
    } else {
      contentLabel = e;

      for (let tab of tabs) {
        tab.classList.remove('active');
        if (tab.classList.contains(`tabs__${contentLabel}`)) {
          tab.classList.add('active');
        }
      }
    }

    for (let c of content) {
      c.classList.remove('active');
      if (c.classList.contains(`container--${contentLabel}`)) {
        c.classList.add('active');
      }
    }

    if (useHash) {
      history.pushState(null, null, `${window.location.origin}${window.location.pathname}#${contentLabel}`); // set hash without reloading page
    }
  }
};

module.exports = () => new Constructor();
