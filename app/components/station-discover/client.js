'use strict';

function Constructor(el) {
  this.discoverTab = document.querySelector('.tabs__discover');
  this.dropdown = document.querySelectorAll('.tabs__discover li');
  this.mobileDropdown = el.querySelector('.station-discover__dropdown--mobile');
  this.stationLists = el.querySelectorAll('.station-discover__stations-list');

  this.activateAllLists();
  this.addNavigationListeners();
}

Constructor.prototype = {
  /**
   * Add navigation listeners
   * @function
   */
  addNavigationListeners: function () {
    this.discoverTab.addEventListener('click', function () { this.activateAllLists(); }.bind(this));
    this.mobileDropdown.addEventListener('change', function (e) { this.activateFilteredList(e); }.bind(this));

    for (let option of this.dropdown) {
      option.addEventListener('click', function (e) { this.activateFilteredList(e); }.bind(this));
    }
  },
  /**
     * Show all station lists in discover tab
     * @function
     */
  activateAllLists: function () {
    for (let list of this.stationLists) {
      list.classList.add('active');
    }
  },
  /**
     * Show filtered station list only
     * @function
     * @param {object} event
     */
  activateFilteredList: function (event) {
    console.log(event);
    let filter;

    if (event.type == 'change') {
      filter = event.target.value;
    } else if (event.type == 'click') {
      filter = event.currentTarget.classList[0].replace('discover__tab--','');
    }

    if (filter) {
      for (let list of this.stationLists) {
        list.classList.remove('active');
        if (list.classList.contains(`stations-list--${filter}`)) {
          list.classList.add('active');
        }
      }
    }

  }
};

module.exports = (el) => new Constructor(el);
