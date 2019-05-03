'use strict';

if (typeof window.document.createElement('div').style.webkitLineClamp === 'undefined') {
  document.querySelector('html').classList.add('no-line-clamp');
}
