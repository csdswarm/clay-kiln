'use strict';

/**
 * Yieldmo gets included in two-column-layout with two placements.
 * Inject those placements into the social bar and tags sections of the layout.
 */
function injectYieldmo() {
  const yieldmo = document.querySelector('.component--yieldmo'),
    bodyContent = document.getElementsByClassName('body__content')[0];

  if (bodyContent) {
    bodyContent.insertAdjacentElement('afterbegin', yieldmo);
  }

  // if the yieldmo script has already been loaded, request a spa pageview, else initialize it.
  if (window._ym) {
    window._ym.requestPageView([yieldmo.querySelector('.placement-1').id]);
  } else {
    /* eslint-disable */
    !function(e,t){if(void 0===t._ym){var a=Math.round(5*Math.random()/3)+'';t._ym='';var m=e.createElement('script');m.type='text/javascript',m.async=!0,m.src='//static.yieldmo.com/ym.'+a+'.js',(e.getElementsByTagName('head')[0]||e.getElementsByTagName('body')[0]).appendChild(m)}else t._ym instanceof String||void 0===t._ym.chkPls||t._ym.chkPls()}(document,window);
    /* eslint-enable */
  }
}

document.addEventListener('yieldmo-mount', injectYieldmo);

