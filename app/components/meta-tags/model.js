'use strict';

const _get = require('lodash/get'),
  makeFromPathname = require('../../services/universal/make-from-pathname'),
  getTrackingPageData = require('../../services/universal/get-tracking-page-data'),
  { NMC, OG_TYPE } = require('../../services/universal/shared-tracking-vars');

module.exports.render = (ref, data, locals) => {
  const AUTHOR_NAME = 'article:author:name',
    PUB_TIME = 'article:published_time',
    CATEGORY = 'cXenseParse:recs:category',
    STATION_CALL_LETTERS = 'station-call-letters',
    categories = [],
    { station, url } = locals,
    fromPathname = makeFromPathname({ url }),
    { importedNmcData } = data,
    category = importedNmcData.category || fromPathname.getCategory(station) || 'music',
    genre = importedNmcData.genre || fromPathname.getGenre(station) || 'aaa',
    pageData = getTrackingPageData(fromPathname.getPathname(), data.contentType),
    pageId = importedNmcData.pid || fromPathname.getPageId(pageData),
    tags = importedNmcData.tag || fromPathname.getTags(pageData, (data.contentTagItems || []).map(i => i.text)).join(', '),
    marketName = importedNmcData.market || _get(station, 'market_name'),
    stationCallsign = importedNmcData.station || fromPathname.isStationDetail()
      ? _get(station, 'callsign', 'natlrc')
      : 'natlrc';

  // save these for SPA to easily be able to create or delete tags without knowing property / names
  // lets us only have to update meta-tags component when adding / removing meta tags in the future
  data.metaTags = [
    { name: NMC.cat, content: category },
    { name: NMC.genre, content: genre },
    { name: NMC.station, stationCallsign },
    { name: NMC.tag, content: tags }
  ];
  data.unusedTags = [];

  // add content type tag
  if (data.contentType) {
    data.metaTags.push({ property: OG_TYPE, content: data.contentType });
  } else {
    data.unusedTags.push({ type: 'property', property: OG_TYPE });
  }

  // add author tag
  let nmcAuthors = importedNmcData.author;

  if (data.authors.length > 0) {
    const authors = data.authors.map(a => a.text).join(', ');

    if (!nmcAuthors) {
      nmcAuthors = authors;
    }

    data.metaTags.push({ property: AUTHOR_NAME, content: authors });
  } else {
    data.unusedTags.push({ type: 'property', property: AUTHOR_NAME });
  }

  if (nmcAuthors) {
    data.metaTags.push({ name: NMC.author, content: nmcAuthors });
  } else {
    data.unusedTags.push({ type: 'name', name: NMC.author });
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

  if (data.secondaryArticleType) {
    categories.push(data.secondaryArticleType.toLowerCase());
  }

  if (_get(station, 'category')) {
    categories.push(station.category.toLowerCase());
  }

  if (categories.length > 0) {
    data.metaTags.push({ name: CATEGORY, content: categories.join(', ') });
  } else {
    data.unusedTags.push({ type: 'name', name: CATEGORY });
  }

  // add station call letters tag
  if (_get(station, 'callsign')) {
    data.metaTags.push({ name: STATION_CALL_LETTERS, content: station.callsign });
  } else {
    // ON-543: Yes, on every page in www.radio.com unless it's a station page.
    data.metaTags.push({ name: STATION_CALL_LETTERS, content: 'NATL-RC' });
  }

  if (marketName) {
    data.metaTags.push({ name: NMC.market, content: marketName });
  } else {
    data.unusedTags.push({ type: 'name', name: NMC.market });
  }

  if (pageId) {
    data.metaTags.push({ name: NMC.pid, content: pageId });
  } else {
    data.unusedTags.push({ type: 'name', name: NMC.pid });
  }

  return data;
};

module.exports.save = (ref, data, locals) => {
  if (locals && locals.date) {
    data.automatedPublishDate = locals.date;
  }
  return data;
};
