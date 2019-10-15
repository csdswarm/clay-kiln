'use strict';

function init() {
  // NOTE: This is a necessary hack to make the sidebar visible
  Object.assign(document.querySelector('.content__sidebar').style, {
    position: 'relative',
    visibility: 'visible'
  });
}

module.exports = init;
