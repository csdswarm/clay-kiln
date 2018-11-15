'use strict';

/**
 * Add Google Tag Manager script and setup dataLayer array on first page load
 * @function
 */

(() => {
  if (typeof window === 'undefined') {
    return;
  }

  window._taboola = window._taboola || [];
  window._taboola.push({article:'auto'});
  !((e, f, u, i) => { e.async = 1; e.src = u; e.id = i; f.parentNode.insertBefore(e, f);})
  (document.createElement('script'), document.getElementsByTagName('script')[0], '//cdn.taboola.com/libtrc/entercom/loader.js', 'tb_loader_script');

  if (window.performance && typeof window.performance.mark === 'function') {
    window.performance.mark('tbl_ic');
  }
})();

document.addEventListener('taboola-mount', () => {
  window._taboola = window._taboola || [];

  // Only run this on subsequent page loads
  if (!window._taboola.length) {
    window._taboola.push({notify:'newPageLoad'});
  }

  window._taboola.push({
    mode: 'thumbnails-j',
    container: 'taboola-below-article-thumbnails',
    placement: 'Below Article Thumbnails-Radio',
    target_type: 'mix'
  });

  window._taboola.push({article:'auto', url: window.location.href});
});


