'use strict';

function Constructor() {
  const sidebar = document.getElementsByClassName('content__sidebar')[0],
    tabs = document.querySelectorAll('.component--station-detail .tabs li'),
    content = document.querySelectorAll('.component--station-detail .tabbed-content__container');

  this.repositionRightRail(sidebar);
  this.addTabNavigationListeners(tabs, content);
}

Constructor.prototype = {
  /**
   * Add margin top to right rail
   * @function
   * @param {object} sidebar
   */
  repositionRightRail: function (sidebar) {
    sidebar.style.marginTop = '30px';
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
