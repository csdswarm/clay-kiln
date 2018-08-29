'use strict';

function Constructor(el) {
  this.addCopyEventListener();
}

Constructor.prototype = {
  /**
  * Copy text from a button event to the clipboard
  * Adopted from https://stackoverflow.com/a/30810322
  * @function copyToClipboard
  * @param {Object} e - HTML event emitted on button click
  */
  copyToClipboard: function (e) {
    // Create text area for copying
    const textArea = document.createElement("textarea");

    // Hide textArea
    textArea.className = 'share__hidden-text-area';

    // Prepare text and textArea for copying
    textArea.value = e.target.baseURI; // get url from event
    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    try {
      // Copy text
      const successful = document.execCommand('copy');
    } catch (err) {
      console.log('Unable to copy');
    }

    // Remove textArea
    document.body.removeChild(textArea);
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
}

module.exports = el => new Constructor(el);