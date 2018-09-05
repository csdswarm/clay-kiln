'use strict';

const $visibility = require('../../services/client/visibility'),
  LAZY_LOAD_MINIMUM = 3,
  // Facebook cmpt's vertical space must be a certain distance from the viewport for the embed to load
  SHOWN_THRESHOLD = 0.01,
  totalEmbeds = document.querySelectorAll('.facebook-post').length,
  lazyLoadEmbeds = totalEmbeds >= LAZY_LOAD_MINIMUM;
  // The number of Facebook cmpts that must be on the page to activate lazy loading.
  // Without lazy loading, a high number of Facebook embeds may slow page load time tremendously.

  function Constructor(el) {
    this.visible = new $visibility.Visible(el, { shownThreshold: SHOWN_THRESHOLD });
    if (lazyLoadEmbeds) {
      this.hideContent(el);
      this.initializeVisible(el);
    } else {
      FB.XFBML.parse();
    }
  }

  Constructor.prototype = {
    initializeVisible: function (el) {
      this.visible.on('shown', this.showContent.bind(this, el));
    },

    /**
    * Reveal an element's commented-out HTML content.
    * @param {HtmlElement} el
    **/
    showContent: function (el) {
      var html = el.innerHTML;

      if (!el.classList.contains('rendered')) {
        html = html.replace('<!--', '');
        html = this.replaceRight(html, '-->', '');
        el.innerHTML = html;
        el.classList.add('rendered');
        FB.XFBML.parse();
      }
    },

    /**
    * If there are more than a certain number of Facebook embeds
    * comment out the elements HTML content. This function is called
    * before any parsing of the Facebook html happens.
    * @param {HtmlElement} el
    **/
    hideContent: function (el) {
      el.innerHTML = '<!--' + el.innerHTML + '-->';
    },

    /**
    * Replace needle in string.
    * @param {string} str
    * @param {string} needle
    * @param {string} replace
    * @returns {string}
    */
    replaceRight: function (str, needle, replace) {
      var pos = str.lastIndexOf(needle);

      if (pos === -1) return str;
      return str.substring(0, pos) + replace + str.substring(pos + needle.length);
    }
  };

module.exports = el => new Constructor(el);
