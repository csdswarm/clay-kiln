'use strict';

/**
 * Add Google Tag Manager script and setup dataLayer array on first page load
 * @function
 */
(() => {
  if (typeof window === 'undefined') {
    return;
  }

  const firstScript = document.getElementsByTagName('script')[0],
    newScript = document.createElement('script'),
    googleContainerId = document.getElementById('google-tag-manager').getAttribute('data-container-id');

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

  newScript.async = true;
  newScript.src = `https://www.googletagmanager.com/gtm.js?id=GTM-${googleContainerId}`;
  firstScript.parentNode.insertBefore(newScript, firstScript);
})();
