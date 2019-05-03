'use strict';

const _each = require('lodash/each');

module.exports.render = (ref, data, locals) => {
  data.metaTags = [];

  if (data.contentType) data.metaTags.push({ property: 'og:type', value: data.contentType });
  if (data.authors.length > 0) {
    _each(data.authors, author => {
      data.metaTags.push({ property: 'article:author:name', value: author.text });
    });
  }
  if (data.publishDate) data.metaTags.push({ property: 'article:published_time', value: data.publishDate });
  if (data.sectionFront) data.metaTags.push({ name: 'cXenseParse:recs:category', value: data.sectionFront });
  if (data.secondaryArticleType) data.metaTags.push({ name: 'cXenseParse:recs:category', value: data.secondaryArticleType });

  if (locals.station) {
    if (locals.station.category) data.metaTags.push({ name: 'cXenseParse:recs:category', value: locals.station.category });
    if (locals.station.callsign) data.metaTags.push({ name: 'station-call-letters', value: locals.station.callsign });
  }

  // add editorial radio
  // add station call letters
    // only pass NATL-RC on radio.com pages?

  console.log(data);
  console.log(locals);

  return data;
};
