'use strict';

module.exports.capitalize = (str) => {
  return str.split(' ').map(([first, ...rest]) => `${first.toUpperCase()}${rest.join('')}`).join(' ');
};
