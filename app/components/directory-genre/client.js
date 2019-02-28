'use strict';

const Selectr = require('mobius1-selectr');

function Constructor(el) {
  this.mobileDropdown = el.querySelector('.directory-genre__dropdown--mobile');

  if (this.mobileDropdown) {
    this.addNavigationListener();
  }
}

Constructor.prototype = {
  /**
   * Add navigation listener to mobile dropdown
   * @function
   */
  addNavigationListener: function () {
    const selectr = new Selectr(this.mobileDropdown, {
      searchable: false,
      customClass: 'directory-genre__dropdown--mobile'
    });

    selectr.on('selectr.change', (option) => spaLinkService.navigateTo(`/stations/music/${option.value}`) );
  }
};

module.exports = (el) => new Constructor(el);
