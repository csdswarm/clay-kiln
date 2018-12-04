'use strict';

function Constructor(el) {// eslint-disable-line no-unused-vars
  this.url = window.location.href;
  this.addCopyEventListener();
  this.addFacebookUrl();
  this.addTwitterUrl();
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

  addFacebookUrl: function () {
    const facebook = document.getElementsByClassName('share-link--facebook');

    Array.from(facebook, fb => {
      fb.href = `http://www.facebook.com/sharer/sharer.php?u=${this.url}%3Futm_source=fb%26utm_medium=s3%26utm_campaign=sharebutton-t`;
    });
  },

  /**
   * If the URL isnt set on the twitter link, set it
   */
  addTwitterUrl: function () {
    const twitter = document.getElementsByClassName('share-link--twitter');

    Array.from(twitter, t => {
      t.href = t.href.replace(/url=%3F/, `url=${this.url}%3F`);
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
