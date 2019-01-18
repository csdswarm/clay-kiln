'use strict';

const utils = require('../../services/universal/utils'),
  { getComponentInstance } = require('clayutils');

module.exports.save = (uri, data) => {

  // Process hashLinkSuffix input to lowercase alphanumeric chars with hyphenated spaces.
  function hashLinkSuffixProcessor(input) {
    return input.replace(/\W/g, '-').replace(/[^0-9a-z-]/gi, '').toLowerCase();
  }

  if (utils.isFieldEmpty(data.hashLinkSuffix)) {
    // If hashLinkSuffix not set, use title string as input.
    data.hashLinkSuffix = hashLinkSuffixProcessor(data.title);
  } else {
    // If hashLinkSuffix set, process appropriately.
    data.hashLinkSuffix = hashLinkSuffixProcessor(data.hashLinkSuffix);
  }

  return data;
  
};

module.exports.render = (ref, data) => {

  // Create slide direct hash link by appending hashLinkSuffix to the slide instance cuid.
  data.hashLink = `Slide-${getComponentInstance(ref)}-${data.hashLinkSuffix}`;

  return data;
  
};
