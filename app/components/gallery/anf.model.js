'use strict';

const { contentANF } = require('../../services/universal/contentAppleNews');

module.exports = async function (ref, data, locals) {
  return await contentANF(ref, data, locals);
};
