'use strict';

const Selectr = require('mobius1-selectr'),
  spaLinkService = require('../../services/client/spaLink');

class DirectoryLocation {
  constructor(el) {
    this.mobileDropdown = el.querySelector('.directory-location__dropdown--mobile');

    this.addNavigationListener();
  }
  /**
   * Add navigation listener to mobile dropdown
   * @function
   */
  addNavigationListener() {
    const selectr = new Selectr(this.mobileDropdown, {
      searchable: false,
      customClass: 'directory-location__dropdown--mobile'
    });

    selectr.on('selectr.change', (option) => spaLinkService.navigateTo(`/stations/location/${option.value}`) );
  }
}

module.exports = (el) => new DirectoryLocation(el);
