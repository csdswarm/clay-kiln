'use strict';

const _each = require('lodash/each');

module.exports.render = (ref, data, locals) => {
  data.metaTags = [];

  if (data.contentType) data.metaTags.push({ property: 'og:type', content: data.contentType });
  if (data.authors.length > 0) {
    _each(data.authors, author => {
      data.metaTags.push({ property: 'article:author:name', content: author.text });
    });
  }
  if (data.publishDate) data.metaTags.push({ property: 'article:published_time', content: data.publishDate });
  if (data.sectionFront) data.metaTags.push({ name: 'cXenseParse:recs:category', content: data.sectionFront });
  if (data.secondaryArticleType) data.metaTags.push({ name: 'cXenseParse:recs:category', content: data.secondaryArticleType });

  if (locals.station) {
    // toLowerCase to normalize category with sectionFront which is lowercase 
    if (locals.station.category) data.metaTags.push({ name: 'cXenseParse:recs:category', content: locals.station.category.toLowerCase() });
    if (locals.station.callsign) data.metaTags.push({ name: 'station-call-letters', content: locals.station.callsign });
  }

  // add editorial radio
  // add station call letters
    // only pass NATL-RC on radio.com pages?

  return data;
};