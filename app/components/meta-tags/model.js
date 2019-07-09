'use strict';

module.exports.render = (ref, data, locals) => {
  const OG_TYPE = 'og:type',
    AUTHOR_NAME = 'article:author:name',
    PUB_TIME = 'article:published_time',
    CATEGORY = 'cXenseParse:recs:category',
    STATION_CALL_LETTERS = 'station-call-letters',
    categories = [];

  // save these for SPA to easily be able to create or delete tags without knowing property / names
  // lets us only have to update meta-tags component when adding / removing meta tags in the future
  data.metaTags = [];
  data.unusedTags = [];

  // add content type tag
  if (data.contentType) {
    data.metaTags.push({ property: OG_TYPE, content: data.contentType });
  } else {
    data.unusedTags.push({ type: 'property', property: OG_TYPE });
  }

  // add author tag
  if (data.authors.length > 0) {
    const authors = data.authors.map(a => a.text).join(', ');

    data.metaTags.push({ property: AUTHOR_NAME, content: authors });
  } else {
    data.unusedTags.push({ type: 'property', property: AUTHOR_NAME });
  }

  // add pub date tag
  if (data.publishDate) {
    data.metaTags.push({ property: PUB_TIME, content: data.publishDate });
  } else if (data.automatedPublishDate) {
    data.metaTags.push({ property: PUB_TIME, content: data.automatedPublishDate });
  } else {
    data.unusedTags.push({ type: 'property', property: PUB_TIME });
  }

  // normalizing categories to be lowercase (sectionFront is usally already lowercase)
  if (data.sectionFront) {
    categories.push(data.sectionFront.toLowerCase());
  }

  if (data.secondarySectionFront) {
    categories.push(data.secondarySectionFront.toLowerCase());
  }

  if (locals.station && locals.station.category) {
    categories.push(locals.station.category.toLowerCase());
  }

  if (categories.length > 0) {
    data.metaTags.push({ name: CATEGORY, content: categories.join(', ') });
  } else {
    data.unusedTags.push({ type: 'name', name: CATEGORY });
  }

  // add station call letters tag
  if (locals.station && locals.station.callsign) {
    data.metaTags.push({ name: STATION_CALL_LETTERS, content: locals.station.callsign });
  } else {
    // ON-543: Yes, on every page in www.radio.com unless it's a station page.
    data.metaTags.push({ name: STATION_CALL_LETTERS, content: 'NATL-RC' });
  }

  return data;
};

module.exports.save = (ref, data, locals) => {
  if (locals && locals.date) {
    data.automatedPublishDate = locals.date;
  }
  return data;
};
