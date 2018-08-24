'use strict';

const $visibility = require('../../services/client/visibility'),
  // Number of video cmpts that must be on the page to activate lazy loading.
  // Without lazy loading, a high number of videos may crash some browsers.
  LAZY_LOAD_MINIMUM = 3,
  // Percentage of video cmpt's vertical space must be shown for the video to load
  SHOWN_TRESHOLD = 0.05,
  totalVideos = document.querySelectorAll('.video-component').length,
  lazyLoadVideos = totalVideos >= LAZY_LOAD_MINIMUM;

function Constructor(el) {
  if (lazyLoadVideos) {
    initializeVisible(el);
  } else {
    showContent(el);
  }
}

function initializeVisible(el) {
  var visible = new $visibility.Visible(el, {
    shownThreshold: SHOWN_TRESHOLD
  });

  visible.on('shown', showContent.bind(this, el));
  visible.on('hidden', hideContent.bind(this, el));
}

/**
* Reveal an element's commented-out HTML content.
* @param {HtmlElement} el
**/
function showContent(el) {
  var html = el.innerHTML;

  html = html.replace('<!--', '');
  html = replaceRight(html, '-->', '');
  el.innerHTML = html;
};

/**
* Comment out an elements HTML content.
* @param {HtmlElement} el
**/
function hideContent(el) {
  el.style.height = el.clientHeight + 'px'; // freeze height
  el.innerHTML = '<!--' + el.innerHTML + '-->';
};

/**
* Replace needle in string.
* @param {string} str
* @param {string} needle
* @param {string} replace
* @returns {string}
*/
function replaceRight(str, needle, replace) {
  var pos = str.lastIndexOf(needle);

  if (pos === -1) return str;
  return str.substring(0, pos) + replace + str.substring(pos + needle.length);
}

module.exports = el => new Constructor(el);
