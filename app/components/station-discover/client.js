'use strict';

function Constructor() {
  const stationDiscover = document.querySelector('.component--station-discover'),
    discoverTab = stationDiscover.querySelector('.component--station-detail .tabs__discover'),
    dropdown = discoverTab.querySelectorAll('li'),
    mobileDropdown = stationDiscover.querySelector('.station-discover__dropdown--mobile'),
    stationLists = stationDiscover.querySelectorAll('.station-discover__stations-list');

  this.addNavigationListeners(discoverTab, dropdown, mobileDropdown, stationLists);
}

Constructor.prototype = {
  /**
   * Add navigation listeners
   * @function
   * @param {object} discoverTab
   * @param {object[]} dropdown
   * @param {object} mobileDropdown
   * @param {object[]} stationLists
   */
  addNavigationListeners: function (discoverTab, dropdown, mobileDropdown, stationLists) {
    discoverTab.addEventListener('click', function () { this.activateAllLists(stationLists); }.bind(this));
    mobileDropdown.addEventListener('change', function (e) { this.activateFilteredList(e, stationLists); }.bind(this));

    for (let option of dropdown) {
      option.addEventListener('click', function (e) { this.activateFilteredList(e, stationLists); }.bind(this));
    }
  },
  /**
     * Show all station lists in discover tab
     * @function
     * @param {object[]} stationLists
     */
  activateAllLists: function (stationLists) {
    for (let list of stationLists) {
      list.classList.add('active');
    }
  },
  /**
     * Show filtered station list only
     * @function
     * @param {object} event
     * @param {object[]} stationLists
     */
  activateFilteredList: function (event, stationLists) {
    console.log(event);
    let filter;

    if (event.type == 'change') {
      filter = event.target.value;
    } else if (event.type == 'click') {
      filter = event.currentTarget.classList[0].replace('discover__tab--','');
    }

    if (filter) {
      for (let list of stationLists) {
        list.classList.remove('active');
        if (list.classList.contains(`stations-list--${filter}`)) {
          list.classList.add('active');
        }
      }
    }

  }
};

module.exports = () => new Constructor();
