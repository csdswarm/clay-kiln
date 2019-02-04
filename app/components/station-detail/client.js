'use strict';

function Constructor() {
  const sidebar = document.getElementsByClassName('content__sidebar')[0],
    stationDetail = document.querySelector('.component--station-detail'),
    tabs = stationDetail.querySelectorAll('.tabs li'),
    content = stationDetail.querySelectorAll('.tabbed-content__container');

  this.repositionRightRail(sidebar, stationDetail);
  this.addTabNavigationListeners(tabs, content);
}

Constructor.prototype = {
  /**
   * Add margin top to right rail
   * @function
   * @param {object} sidebar
   * @param {object} stationDetail
   */
  repositionRightRail: function (sidebar, stationDetail) {
    sidebar.style.marginTop = window.getComputedStyle(stationDetail).marginTop;
    sidebar.style.visibility = 'visible';
  },
  /**
   * Add navigation listeners to tabs
   * @function
   * @param {object[]} tabs
   * @param {object[]} content
   */
  addTabNavigationListeners: function (tabs, content) {
    for (let tab of tabs) {
      tab.addEventListener('click', function (e) { this.activateTab(e, tabs, content); }.bind(this));
    }
  },
  /**
   * Navigate between tabs
   * @function
   * @param {object} event
   * @param {object[]} tabs
   * @param {object[]} content
   */
  activateTab: function (event, tabs, content) {
    for (let tab of tabs) {
      tab.classList.remove('active');
    }
    const contentLabel = event.currentTarget.classList[0].replace('tabs__','');

    event.currentTarget.classList.add('active');

    for (let c of content) {
      c.classList.remove('active');
      if (c.classList.contains(`container--${contentLabel}`)) {
        c.classList.add('active');
      }
    }
  }
};

module.exports = () => new Constructor();
