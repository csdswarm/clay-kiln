'use strict';

const Selectr = require('mobius1-selectr');

class StationDiscover {
  constructor(el) {
    this.discoverTab = document.querySelector('.tabs__discover span');
    this.dropdown = document.querySelectorAll('.tabs__discover li');
    this.mobileDropdown = el.querySelector('.station-discover__dropdown--mobile');
    this.stationLists = el.querySelectorAll('.station-discover__stations-list');

    this.activateAllLists();
    this.addNavigationListeners();
  }
  /**
   * Add navigation listeners
   * @function
   */
  addNavigationListeners() {
    this.discoverTab.addEventListener('click', (e) => this.activateAllLists(e) );
    // this.mobileDropdown.addEventListener('change', (e) => this.activateFilteredList(e) );

    const selectr = new Selectr(this.mobileDropdown, {
      searchable: false,
      customClass: 'station-discover__dropdown--mobile'
    });

    selectr.on('selectr.change', (option) => this.activateFilteredList(option) );

    for (let option of this.dropdown) {
      option.addEventListener('click', (e) => this.activateFilteredList(e) );
    }
  }
  /**
     * Show all station lists in discover tab
     * @function
     * @param {object} [event]
     */
  activateAllLists(event) {
    if (!event || event.target === this.discoverTab) {
      for (let list of this.stationLists) {
        list.classList.add('active');
      }
    }
  }
  /**
     * Show filtered station list only
     * @function
     * @param {object} event or option
     */
  activateFilteredList(event) {
    let filter;

    if (event.value) {
      filter = event.value;
    } else if (event.type === 'click') {
      filter = event.target.classList[1].replace('discover__tab--','');
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
}

module.exports = (el) => new StationDiscover(el);
