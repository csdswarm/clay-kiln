'use strict';

/**
 * Yieldmo gets included in two-column-layout with two placements.
 * Inject those placements into the social bar and tags sections of the layout.
 */
function injectYieldmo() {
  const socialBar = document.getElementsByClassName('info--right-bottom')[0],
    yieldmo1 = document.getElementById('ym_2071731061939406471'),
    tagsSection = document.getElementsByClassName('component--tags')[0],
    yieldmo2 = document.getElementById('ym_2071731315686409865');

  socialBar.appendChild(yieldmo1);
  tagsSection.after(yieldmo2);

  // a bundle i got from yieldmo, doesn't pass lint but nothing I can do about it.
  !function(e,t){if(void 0===t._ym){var a=Math.round(5*Math.random()/3)+'';t._ym='';var m=e.createElement('script');m.type='text/javascript',m.async=!0,m.src='//static.yieldmo.com/ym.'+a+'.js',(e.getElementsByTagName('head')[0]||e.getElementsByTagName('body')[0]).appendChild(m)}else t._ym instanceof String||void 0===t._ym.chkPls||t._ym.chkPls()}(document,window);
}

document.addEventListener('yieldmo-mount', injectYieldmo);

