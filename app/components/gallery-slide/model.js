'use strict';

const utils = require('../../services/universal/utils'),
  { getComponentInstance } = require('clayutils');

module.exports.save = (uri, data) => {

  // Process hashLinkSuffix property.
  if (utils.isFieldEmpty(data.hashLinkSuffix)) {
    // If hashLinkSuffix not set, default hash link to lowercase alphanumeric hyphenated spaces version of title string.
    data.hashLinkSuffix = data.title.replace(/\W/g, '-').replace(/[^0-9a-z-]/gi, '').toLowerCase();
  } else {
    // Sanitize hashLinkSuffix as url safe lowercase alphanumeric hyphenated spaces
    data.hashLinkSuffix = data.hashLinkSuffix.replace(/\W/g, '-').replace(/[^0-9a-z-]/gi, '').toLowerCase();
  }

  return data;
  
};

module.exports.render = (ref, data, locals) => {

  // Create slide direct hash link by appending hashLinkSuffix to the slide instance cuid.
  data.hashLink = `Slide-${getComponentInstance(ref)}-${data.hashLinkSuffix}`;

  return data;
  
};
