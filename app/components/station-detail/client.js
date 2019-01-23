'use strict';

function Constructor() {
  const sidebar = document.getElementsByClassName('content__sidebar')[0];

  this.repositionRightRail(sidebar);
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
  }
};

module.exports = () => new Constructor();
