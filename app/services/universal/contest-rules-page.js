'use strict';

const url = require('url');

/*
  Determines if it is in presentation mode based on url

  @param {String} urlstring
  @returns {Bool}
*/
module.exports.isPresentationMode = (urlString) => {
  const { pathname } = url.parse(urlString);

  return pathname.split('/').includes('contests');
};
