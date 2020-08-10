'use strict';

const addUriToCuratedItems = require('../../services/server/component-upgrades/add-uri-to-curated-items');

module.exports['1.0'] = function (uri, data) {
  // Clone so we don't lose value by reference
  const newData = Object.assign({}, data);

  // Replace articleType with sectionFront
  if (newData.populateBy == 'articleType') {
    newData.populateBy = 'sectionFront';
  }
  newData.sectionFront = data.sectionFront || data.articleType;
  delete newData.articleType;

  return newData;
};

module.exports['2.0'] = function (uri, data) {
  if (!data.contentType) {
    data.contentType = { article: true, gallery: true };
  }

  return data;
};

module.exports['3.0'] = function (uri, data) {
  const { populateBy, ...restOfData } = data;

  return { ...restOfData, populateFrom: populateBy };
};

module.exports['4.0'] = async (uri, data, locals) => {
  await addUriToCuratedItems(uri, data.items, locals);

  return data;
};

module.exports['5.0'] = (uri, data) => {

  if (data.populateBy) {
    data.populateFrom = data.populateBy;
    delete data.populateBy;
  }

  if (typeof data.populateFrom === 'string') {
    data.populateFrom = data.populateFrom.replace(/sectionFront/, 'section-front');
  }

  return data;
};

module.exports['6.0'] = (uri, data) => {
  if (typeof data.customTitle === 'undefined') {
    data.customTitle = '';
  }

  return data;
};

module.exports['7.0'] = (uri, data) => {
  // Account for inccorrect formatting of data.tag in the database for previously created content.
  // Instances of data.tag that do not return an empty array, or properly formatted tag array will break the kiln UI.
  // e.g. tag array: data.tag: [] || data.tag: [{ text: 'tag' }].
  if (data.tag === null || data.tag === undefined || data.tag.length === 0) {
    data.tag = [];
    return data;
  } else if (Array.isArray(data.tag)) {
    data.tag = data.tag.map((tag) => typeof tag === 'string' ? { text: tag } : tag);
    return data;
  } else if (typeof data.tag === 'string') {
    data.tag = [{ text: data.tag }];
    return data;
  }
  return data;
};
