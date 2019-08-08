'use strict';

const SelectBox = require('../../services/client/selectbox'),
  spaLinkService = require('../../services/universal/spaLink');

class DirectoryGenre {
  constructor(el) {
    this.mobileDropdown = el.querySelector('.directory-genre__dropdown--mobile');

    if (this.mobileDropdown) {
      this.addNavigationListener();
    }
  }
  /**
   * Add navigation listener to mobile dropdown
   * @function
   */
  addNavigationListener() {
    const select = new SelectBox(this.mobileDropdown, {
      searchable: false,
      customClass: 'directory-genre__dropdown--mobile'
    });

    select.addEventListener('change', (option) => spaLinkService.navigateTo(`/stations/music/${option.value}`) );
  }
}

module.exports = el => new DirectoryGenre(el);
