'use strict';

function capitalize(str) {
  return str.split(' ').map(([first, ...rest]) => `${first.toUpperCase()}${rest.join('')}`).join(' ');
}

module.exports.capitalize = capitalize;
