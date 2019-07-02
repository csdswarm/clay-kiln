'use strict';

const qs = require('querystring');

function Constructor(el) {// eslint-disable-line no-unused-vars
  this.url = window.location.href;
  this.stationCallSign = el.getAttribute('data-station-call-sign');
  this.domain = el.getAttribute('data-domain');
  this.title = el.getAttribute('data-title');
  this.twitterHandle = el.getAttribute('data-twitter-handle');
  this.addCopyEventListener();
  this.addFacebookUrl();
  this.addTwitterUrl();
  this.addEmailShare();
}

Constructor.prototype = {
  /**
  * Copy text from a button event to the clipboard
  * Adopted from https://stackoverflow.com/a/30810322
  * @function copyToClipboard
  * @param {Object} e - HTML event emitted on button click
  */
  copyToClipboard: function () {
    // Create text area for copying
    const textArea = document.createElement('textarea');

    // Hide textArea
    textArea.className = 'share__hidden-text-area';

    // Prepare text and textArea for copying
    textArea.value = this.url;
    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    try {
      // Copy text
      document.execCommand('copy');
    } catch (err) {
      console.log('Unable to copy');
    }

    // Remove textArea
    document.body.removeChild(textArea);
  },

  addUtmTracking: function (url, params = {}) {
    return encodeURIComponent(`${url}?${qs.stringify({
      utm_campaign: 'sharebutton',
      utm_medium: 'social',
      utm_term: this.stationCallSign,
      ...params
    })}`);
  },

  addFacebookUrl: function () {
    const facebook = document.getElementsByClassName('share-link--facebook'),
      facebookUrl = this.addUtmTracking(this.url, {utm_source: 'facebook.com'});

    Array.from(facebook, fb => {
      fb.href = `http://www.facebook.com/sharer/sharer.php?u=${facebookUrl}`;
    });
  },

  /**
   * If the URL isnt set on the twitter link, set it
   */
  addTwitterUrl: function () {
    const twitter = document.getElementsByClassName('share-link--twitter'),
      twitterUrl = this.addUtmTracking(this.url, { utm_source: 'twitter.com'});

    Array.from(twitter, t => {
      t.href = `https://twitter.com/share?text=${this.title}&via=${this.twitterHandle}&url=${twitterUrl}`;
    });
  },

  addEmailShare: function () {
    const email = document.getElementsByClassName('share-link--email'),
      emailBody = this.addUtmTracking(this.url, {utm_source: this.domain, utm_medium: 'email'});

    Array.from(email, e => {
      e.href = `mailto:?subject=${this.title}&body=${emailBody}`;
    });
  },

  /**
  * Add event listener for all .copy-link elements
  * @function addCopyEventListener
  */
  addCopyEventListener: function () {
    const copyLinks = document.getElementsByClassName('share-link--copy-link');

    // Convert copyLinks to an array, and add a click event listener for each
    Array.from(copyLinks, cl => {
      cl.addEventListener('click', e => this.copyToClipboard(e));
    });
  }
};
module.exports = el => new Constructor(el);
