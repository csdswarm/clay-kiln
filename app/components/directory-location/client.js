'use strict';

const SelectBox = require('../../services/client/selectbox'),
  spaLinkService = require('../../services/universal/spaLink');

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
    const select = new SelectBox(this.mobileDropdown, {
      searchable: false,
      customClass: 'directory-location__dropdown--mobile'
    });

    select.addEventListener('change', (option) => spaLinkService.navigateTo(`/stations/location/${option.value}`) );
  }
}

module.exports = (el) => new DirectoryLocation(el);
