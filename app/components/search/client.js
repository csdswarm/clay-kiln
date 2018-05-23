'use strict';

const dom = require('@nymag/dom');

function Constructor(el) {
  this.el = el;
  this.search = dom.find(el, '.search-form');
  this.query = dom.find(el, '.search-query');
  this.expand = dom.find(el, '.expand-button');
  this.close = dom.find(el, '.close-button');
  this.submit = dom.find(el, '.submit-button');
  this.placeholderText = el.getAttribute('data-placeholder-text') || '';
  this.query.value = '';
  this.vultureHomepage = dom.find(document, '.vulture-header.homepage-breakpoint');

  this.search.addEventListener('keypress', this.expandSearch.bind(this));
  this.query.addEventListener('keypress', this.expandSearch.bind(this));
  this.query.addEventListener('click', this.expandSearch.bind(this));
  this.query.addEventListener('blur', this.compressSearch.bind(this));
  this.expand.addEventListener('click', this.expandSearch.bind(this));
  this.submit.addEventListener('click', this.submitHandler.bind(this));
  this.close.addEventListener('click', this.compressSearch.bind(this));
}

Constructor.prototype = {
  compressSearch: function () {
    if (!!this.vultureHomepage && (window.innerWidth >= 1180 && this.query.value == '' || window.innerWidth < 1180)
      || !this.vultureHomepage && (window.innerWidth >= 1024 && this.query.value == '' || window.innerWidth < 1024)) {
      this.search.classList.remove('expanded');
      this.query.placeholder = this.placeholderText;
      this.query.value = '';
    }
  },
  expandSearch: function () {
    if (!this.search.classList.contains('expanded')) {
      this.search.classList.add('expanded');
      this.query.value = '';
      if (window.innerWidth < 1024 || !!this.vultureHomepage && window.innerWidth < 1180) {
        this.query.placeholder = '';
      } else {
        this.query.placeholder = this.placeholderText;
      }
      this.query.focus();
    }
  },
  submitHandler: function () {
    this.search.submit();
  }
};

module.exports = el => new Constructor(el);
