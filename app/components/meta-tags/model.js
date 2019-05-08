'use strict';

module.exports.render = (ref, data, locals) => {
  data.metaTags = [];

  if (data.contentType) data.metaTags.push({ property: 'og:type', content: data.contentType });
  if (data.authors.length > 0) {
    const authors = data.authors.map(a => a.text).join(', ');

    data.metaTags.push({ property: 'article:author:name', content: authors });
  }

  // this is already done in meta-url -- do we need it in both places?
  if (data.publishDate) {
    data.metaTags.push({ property: 'article:published_time', content: data.publishDate });
  } else if (data.automatedPublishDate) {
    data.metaTags.push({ property: 'article:published_time', content: data.automatedPublishDate });
  }

  const categories = [];

  // normalizing categories to be lowercase (sectionFront is usally already lowercase)
  if (data.sectionFront) categories.push(data.sectionFront.toLowerCase());
  if (data.secondaryArticleType) categories.push(data.secondaryArticleType.toLowerCase());
  if (categories.length > 0) {
    data.metaTags.push({ name: 'cXenseParse:recs:category', content: categories.join(', ') });
  }

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

module.exports.save = (ref, data, locals) => {
  if (locals && locals.date) {
    data.automatedPublishDate = locals.date;
  }
  return data;
};
