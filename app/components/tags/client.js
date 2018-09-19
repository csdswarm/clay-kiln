'use strict';

const _ = require('lodash'),
  dom = require('@nymag/dom');

function Constructor(el) {
  this.el = el;
  this.showAll = dom.find(this.el, '.more');

}

Constructor.prototype = {
  // events: {
  //   'a.more click': 'showAll'
  // },
  showAll: function (e) {
    var button = e.target;

    _.forEach(hiddenTags, function (hiddenTag) {
      hiddenTag.classList.remove('hidden');
    });
    button.parentNode.removeChild(button);
    e.preventDefault();
  }
};

module.exports = el => new Constructor(el);
