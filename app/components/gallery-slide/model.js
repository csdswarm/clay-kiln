'use strict';

const utils = require('../../services/universal/utils'),
  { getComponentInstance } = require('clayutils');

module.exports.save = (uri, data) => {

  // Process hashLinkPrefix input to lowercase alphanumeric chars with hyphenated spaces.
  function hashLinkPrefixProcessor(input) {
    return input.replace(/\W/g, '-').replace(/[^0-9a-z-]/gi, '').toLowerCase();
  }

  if (utils.isFieldEmpty(data.hashLinkPrefix)) {
    // If hashLinkPrefix not set, use title string as input.
    data.hashLinkPrefix = hashLinkPrefixProcessor(data.title);
  } else {
    // If hashLinkPrefix set, process appropriately.
    data.hashLinkPrefix = hashLinkPrefixProcessor(data.hashLinkPrefix);
  }

  return data;

};

module.exports.render = (ref, data) => {

  // Create slide direct hash link by appending hashLinkPrefix to the slide instance cuid.
  data.hashLink = `${data.hashLinkPrefix}-${getComponentInstance(ref)}`;

  // Create Gallery Slide Type class
  const galleryType = data.sectionFront ? data.sectionFront : 'default';

  data.galleryTypeClass = `component--gallery-slide__${galleryType}`;

  return data;

};
