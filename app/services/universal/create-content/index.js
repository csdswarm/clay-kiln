'use strict';

const
  _get = require('lodash/get'),
  applyContentSubscriptions = require('./apply-content-subscriptions'),
  articleOrGallery = new Set(['article', 'gallery']),
  circulationService = require('../circulation'),
  dateFormat = require('date-fns/format'),
  dateParse = require('date-fns/parse'),
  mediaplay = require('../media-play'),
  promises = require('../promises'),
  rest = require('../rest'),
  sanitize = require('../sanitize'),
  slugifyService = require('../slugify'),
  striptags = require('striptags'),
  urlExists = require('../url-exists'),
  { addStationsByEditorialGroup } = require('../editorial-feed-syndication'),
  { generateSyndicationSlug } = require('../syndication-utils'),
  { getComponentName } = require('clayutils'),
  {
    has,
    isFieldEmpty,
    replaceVersion,
    uriToUrl,
    urlToElasticSearch
  } = require('../utils'),
  { DEFAULT_STATION } = require('../constants'),
  { PAGE_TYPES } = require('../constants');

/**
 * only allow emphasis, italic, and strikethroughs in headlines
 * @param  {string} oldHeadline
 * @returns {string}
 */
function stripHeadlineTags(oldHeadline) {
  const newHeadline = striptags(oldHeadline, ['em', 'i', 'strike']);

  // if any tags include a trailing space, shift it to outside the tag
  return newHeadline.replace(/ <\/(i|em|strike)>/g, '</$1> ');
}

/**
 * sanitize headlines and teasers
 * @param  {object} data
 */
function sanitizeInputs(data) {
  if (has(data.primaryHeadline)) {
    data.primaryHeadline = sanitize.toSmartHeadline(stripHeadlineTags(data.primaryHeadline));
  }

  if (has(data.shortHeadline)) {
    data.shortHeadline = sanitize.toSmartHeadline(stripHeadlineTags(data.shortHeadline));
  }

  if (has(data.headline)) {
    data.headline = sanitize.toSmartHeadline(stripHeadlineTags(data.headline));
  }

  if (has(data.seoHeadline)) {
    // seo headline doesn't allow any html, but should get curly quotes, fancy dashes, and ellipses
    data.seoHeadline = sanitize.toSmartHeadline(striptags(data.seoHeadline));
  }

  if (has(data.teaser)) {
    data.teaser = sanitize.toSmartText(stripHeadlineTags(data.teaser));
  }

  if (has(data.seoDescription)) {
    // seo description doesn't allow any html, but should get curly quotes (and decoded entities)
    data.seoDescription = sanitize.toSmartText(striptags(data.seoDescription));
  }
}

/**
 * generate the social headline from the headline
 * if the social headline is empty and the headline is less than 80 characters
 * @param  {object} data
 */
function generatePrimaryHeadline(data) {
  if (isFieldEmpty(data.primaryHeadline) && has(data.headline) && data.headline.length < 80) {
    // note: this happens AFTER headline is sanitized
    data.primaryHeadline = data.headline;
  }
}

/**
 * add extra stuff to the page title on certain sites
 * @param {string} title
 * @param {object} locals
 * @returns {string}
 */
function addSiteTitle(title, locals) {
  // add '-- Science of Us' if we're on that site
  if (_get(locals, 'site.slug') === 'scienceofus') {
    return `${title} -- Science of Us`;
  } else if (_get(locals, 'site.slug') === 'press') {
    // add '-- New York Media Press Room' if we're on that site
    return `${title} -- New York Media Press Room`;
  } else {
    return title;
  }
}

/**
 * generate plaintext pageTitle / twitterTitle / ogTitle
 * on every save
 * @param  {object} data
 * @param  {object} locals
 */
function generatePageTitles(data, locals) {
  if (has(data.seoHeadline) || has(data.shortHeadline) || has(data.primaryHeadline)) {
    const plaintextTitle = sanitize.toPlainText(data.seoHeadline || data.shortHeadline || data.primaryHeadline);

    // published to pageTitle
    data.pageTitle = addSiteTitle(plaintextTitle, locals);
  }

  if (has(data.primaryHeadline)) {
    // published to ogTitle
    data.plaintextPrimaryHeadline = sanitize.toPlainText(data.primaryHeadline);
  }

  if (has(data.shortHeadline)) {
    // published to twitterTitle
    data.plaintextShortHeadline = sanitize.toPlainText(data.shortHeadline);
  }
}

/**
 * add extra stuff to the description on sponsored stories
 * @param {string} desc
 * @param {object} data
 * @returns {string}
 */
function addSponsoredDescription(desc, data) {
  if (_get(data, 'featureTypes["Sponsor Story"]')) {
    return `PAID STORY: ${desc}`;
  } else {
    return desc;
  }
}

/**
 * generate pageDescription from seoDescription / teaser
 * @param  {object} data
 */
function generatePageDescription(data) {
  if (has(data.seoDescription) || has(data.teaser)) {
    const plaintextDesc = sanitize.toPlainText(data.seoDescription || data.teaser);

    // published to pageDescription
    data.pageDescription = addSponsoredDescription(plaintextDesc, data);
  }

  if (has(data.teaser)) {
    // published to socialDescription (consumed by share components and og:description/twitter:description)
    data.socialDescription = addSponsoredDescription(sanitize.toPlainText(data.teaser), data);
  }
}

/**
 * set the publish date from the locals (even if it's already set),
 * and format it correctly
 * @param  {object} data
 * @param  {object} locals
 */
function formatDate(data, locals) {
  if (_get(locals, 'date')) {
    // if locals and locals.date exists, set the content date (overriding any date already set)
    data.date = dateFormat(locals.date); // ISO 8601 date string
  } else if (has(data.galleryDate) || has(data.galleryTime)) {
    // make sure both date and time are set. if the user only set one, set the other to today / right now
    data.galleryDate = has(data.galleryDate) ? data.galleryDate : dateFormat(new Date(), 'YYYY-MM-DD');
    data.galleryTime = has(data.galleryTime) ? data.galleryTime : dateFormat(new Date(), 'HH:mm');
    // generate the `date` data from these two fields
    data.date = dateFormat(dateParse(data.galleryDate + ' ' + data.galleryTime)); // ISO 8601 date string
  } else if (has(data.articleDate) || has(data.articleTime)) {
    // make sure both date and time are set. if the user only set one, set the other to today / right now
    data.articleDate = has(data.articleDate) ? data.articleDate : dateFormat(new Date(), 'YYYY-MM-DD');
    data.articleTime = has(data.articleTime) ? data.articleTime : dateFormat(new Date(), 'HH:mm');
    // generate the `date` data from these two fields
    data.date = dateFormat(dateParse(data.articleDate + ' ' + data.articleTime)); // ISO 8601 date string
  } else {
    data.date = dateFormat(new Date()); // ISO 8601 date string
  }
}

/**
 * set the canonical url from the locals (even if it's already set)
 * @param {object} data
 * @param {object} locals
 */
function setCanonicalUrl(data, locals) {
  if (_get(locals, 'publishUrl')) {
    data.canonicalUrl = urlToElasticSearch(locals.publishUrl);
  }
}

/**
 * get content's previously-saved data, if it exists
 * note: only grab the data if we're thinking of updating the slug
 * @param  {string} uri
 * @param {object} data
 * @param {object} locals
 * @return {Promise}
 */
function getPrevData(uri, data, locals) {
  if (has(data.seoHeadline) || has(data.shortHeadline) || has(data.slug)) {
    return promises.timeout(rest.get(uriToUrl(replaceVersion(uri), locals)), 1000).catch(() => null); // fail gracefully
  }
}

/**
 * get content's previously-published data, if it exists
 * note: only grab the data if we're thinking of updating the slug
 * @param  {string} uri
 * @param {object} data
 * @param {object} locals
 * @return {Promise}
 */
function getPublishedData(uri, data, locals) {
  if (has(data.seoHeadline) || has(data.shortHeadline) || has(data.slug)) {
    return promises.timeout(rest.get(uriToUrl(replaceVersion(uri, 'published'), locals)), 1000).catch(() => null); // fail gracefully
  }
}

/**
 * determine if user has manually updated the slug on initial save
 * @param  {object} data
 * @param  {object|null} prevData
 * @return {Boolean}
 */
function initialManualSlug(data, prevData) {
  return !prevData ? data.slug !== '' : false;
}

/**
 * determine if user has manually updated the slug
 * note: manually removing the slug (setting it to emptystring)
 * is still considered manually updating the slug
 * note: this checks the new data before any slug would be generated,
 * so we're directly comparing what the user is saving to the old data
 * @param  {object} data
 * @param  {object|null} prevData
 * @return {Boolean}
 */
function manualSlugUpdate(data, prevData) {
  return prevData ? data.slug !== prevData.slug : false;
}

/**
 * determine if user has manually locked the slug (by going into settings)
 * @param  {object} data
 * @param  {object|null} prevData
 * @return {Boolean}
 */
function manualSlugLock(data, prevData) {
  return prevData ? prevData.slugLock === false && data.slugLock === true : false;
}

/**
 * determine if user has manually unlocked the slug (by going into settings)
 * @param  {object} data
 * @param  {object|null} prevData
 * @return {Boolean}
 */
function manualSlugUnlock(data, prevData) {
  return prevData ? prevData.slugLock === true && data.slugLock === false : false;
}

/**
 * generate the slug from the seoHeadline
 * note: they should already have been sanitized
 * @param  {object} data
 */
function generateSlug(data) {
  if (has(data.seoHeadline)) {
    data.slug = sanitize.cleanSlug(data.seoHeadline);
  }
}

/**
 * generate and/or lock the slug
 * @param  {object|null} data
 * @param  {object|null} prevData
 * @param  {object} publishedData
 */
function setSlugAndLock(data, prevData, publishedData) {
  if (initialManualSlug(data, prevData) || manualSlugUpdate(data, prevData)) {
    // if you manually updated the slug, sanitize and update it and lock the slug
    data.slug = data.slug ? sanitize.cleanSlug(data.slug) : data.slug;
    data.slugLock = true;
    data.manualSlugUnlock = false; // manually changing the slug ALWAYS locks it again
  } else if (manualSlugLock(data, prevData)) {
    // if you manually locked the slug, don't generate a new slug
    data.slugLock = true;
    data.manualSlugUnlock = false; // manually locking the slug ALWAYS locks it again (of course)
  } else if (manualSlugUnlock(data, prevData)) {
    // if you manually unlocked the slug, generate a new slug
    generateSlug(data);
    data.manualSlugUnlock = true; // manually unlocking the slug means it won't be locked again (even if published)
  } else if (publishedData && (isFieldEmpty(data.manualSlugUnlock) || data.manualSlugUnlock === false)) {
    // if you've already published the content, don't regenerate the slug
    // note: if you publish and manually unlock the slug, it'll stay unlocked
    // until you either manually write a new slug or manually lock the slug again
    data.slugLock = true;
  } else if (isFieldEmpty(data.slugLock) || data.slugLock === false) {
    // if the slug is NOT locked (and no other situation above matches), generate it
    generateSlug(data);
  } // if the slug is locked (and no other situation above matches), do nothing
}

/**
 * Ensure required data exists on certain page types
 *
 * @param {object} data
 * @param {string} componentName
 */
function standardizePageData(data, componentName) {
  switch (componentName) {
    case PAGE_TYPES.AUTHOR:
      data.feedImgUrl = data.profileImage;
      data.primaryHeadline = data.plaintextPrimaryHeadline = data.seoHeadline = data.teaser = data.author;
      data.slug = sanitize.cleanSlug(data.author);
      break;
    case PAGE_TYPES.CONTENT_COLLECTION:
      data.feedImgUrl = data.image;
      data.primaryHeadline = data.plaintextPrimaryHeadline = data.seoHeadline = data.teaser = data.tag;
      data.slug = sanitize.cleanSlug(data.tag);
      break;
    case PAGE_TYPES.STATIC_PAGES:
      data.primaryHeadline = data.plaintextPrimaryHeadline = data.seoHeadline = data.teaser = data.pageTitle;
      break;
    case PAGE_TYPES.HOST:
      data.feedImgUrl = data.profileImage;
      data.primaryHeadline = data.plaintextPrimaryHeadline = data.seoHeadline = data.teaser = data.host;
      data.slug = sanitize.cleanSlug(data.host);
      break;
    default:
  }
}

/**
 * Remove width, height, cropping, and resolution from silo image url.
 * @param  {object} data
 */
function cleanSiloImageUrl(data) {
  if (has(data.siloImgUrl)) {
    data.siloImgUrl = mediaplay.cleanUrl(data.siloImgUrl);
  }
}

/**
 * Good for when you have a byline array but one
 * of the objects inside the byline has no name.
 * The byline formatter handlebars helper doesn't
 * like this usecase, so we should sanitize before
 * it even has to deal with it.
 *
 * @param {object} data
 */
function sanitizeByline(data) {
  const byline = _get(data, 'byline', []);

  data.byline = byline.filter(entry => !!entry.names);
}

function _capitalize(str) {
  return str.split(' ').map(([first, ...rest]) => `${first.toUpperCase()}${rest.join('')}`).join(' ');
}

/**
 * Iterates over the byline, cleaning and consolidating authors and sources into their own
 * property for backward compatibility and reduced development effort elsewhere
 *
 * @param {object} data
 */
function bylineOperations(data) {
  const authors = [], sources = [], hosts = data.hosts ? data.hosts : [];

  for (const { names, sources: bylineSources, hosts: bylineHosts } of data.byline || []) {
    /*
      Originally a NYMag legacy thing, since we converted the original
      `authors` array into a more complex `byline` structure,
      but we still key a lot of things off the flatter `authors`
      array. That's why we're doing this work, but it's done
      on save as to not affect rendering.
    */
    for (const author of names || []) {
      delete author.count;
      author.slug = slugifyService(author.text);
      author.name = author.name ? author.name : author.text;
      author.text = _capitalize(author.slug.replace(/-/g, ' ').replace(/\//g,''));
      authors.push(author);
    }
    for (const host of bylineHosts || []) {
      delete host.count;
      host.slug = slugifyService(host.text);
      host.name = host.name ? host.name : host.text;
      host.text = _capitalize(host.slug.replace(/-/g, ' ').replace(/\//g,''));
      hosts.push(host);
    }
    // do sources too
    for (const source of bylineSources || []) {
      delete source.count;
      sources.push(source);
    }
  }
  Object.assign(data, { authors, sources, hosts });
  sanitizeByline(data);
}

/**
 * updates the key in the object if it exists replacing the ${key} with value
 *
 * @param {object} obj
 * @param {string} key
 * @param {string} value
 */
function replaceDefaultKeyValue(obj, key, value) {
  if (obj[key]) {
    obj[key] = obj[key].replace(`\${${key}}`, value || '');
  }
}

/**
 * set dateModified to published date if before the publish date.
 * @param {Object} data
 */
function fixModifiedDate(data) {
  if (!data.dateModified || data.dateModified < data.date) {
    data.dateModified = data.date;
  }
}

/**
 * Adds station logo to the byline if it's a station
 * @param {Object} data
 * @param {Object} locals
 */
function addStationLogo(data, locals) {
  const isStation = locals.station.slug !== 'www';

  replaceDefaultKeyValue(data, 'stationLogoUrl', isStation ? locals.station.square_logo_small : '');
  replaceDefaultKeyValue(data, 'stationURL', isStation ? locals.station.website : '');

  if (_get(data, 'byline[0].sources.length')) {
    replaceDefaultKeyValue(data.byline[0].sources[0], 'text', isStation ? locals.station.name : '');
    if (data.byline[0].sources[0].text === '') {
      data.byline[0].sources.length = 0;
    }
  }
}

/**
 * Replaces any radio.com text in the byline with RADIO.COM in capitals
 * @param {Object} data
 */
function upCaseRadioDotCom(data) {
  const sources = _get(data, 'byline[0].sources', []);

  sources.length && sources.forEach(source => {
    source.text = source.text.replace(/radio\.com/gi, 'RADIO.COM');
  });
}

/**
 * Updates the stationSyndication property to be an array of objects from an array of strings
 * @param {Object} data
 */
function updateStationSyndicationType(data) {
  data.stationSyndication = (data.stationSyndication || [])
    .map(callsign => typeof callsign === 'string' ? { callsign } : callsign);
}

/**
 * Set's noIndexNoFollow for meta tag based on information in the component
 * @param {Object} data
 * @returns {Object}
 */
function setNoIndexNoFollow(data) {
  const
    containAP = ({ text }) => text.includes('Associated Press'),
    isContentFromAP = _get(data, 'byline', [])
      .some(({ sources = [], names = [] }) => names.some(containAP) || sources.some(containAP));

  data.isContentFromAP = isContentFromAP;
  data.noIndexNoFollow = data.noIndexNoFollow || isContentFromAP;

  return data;
}

/**
 * Tests if the lead component supports full-width mode
 * @param {Object} data
 * @returns {boolean}
 */
function isFullWidthLeadSupported(data) {
  let supported = false;

  const leadRef = _get(data, 'lead[0]._ref');

  if (leadRef) {
    const componentName = getComponentName(leadRef);

    supported = [
      'brightcove',
      'brightcove-live',
      'image'
    ].includes(componentName);
  }

  return supported;
}

/**
 * Sets computed data for full-width leads
 * @param {Object} data
 * @param {Object} locals
 */
function renderFullWidthLead(data, locals) {
  const supported = isFullWidthLeadSupported(data);

  if (locals.edit) {
    data._computed.supportsFullWidthLead = supported;
  }

  data._computed.renderFullWidthLead = data.fullWidthLead && !locals.edit;
}

/**
 * Sets the full-width lead only if it's supported
 * @param {Object} data
 */
function setFullWidthLead(data) {
  const supported = isFullWidthLeadSupported(data);

  // full-width lead should always be false if the lead component isn't supported
  data.fullWidthLead = supported && data.fullWidthLead;
}

/**
 * For Sports articles and galleries, use @RDCSport twitter handle.
 * @param {Object} data
 * @param {Object} locals
 */
function addTwitterHandle(data, locals) {
  if (data.sectionFront === 'sports') {
    locals.shareTwitterHandle = 'RDCSports';
  }
}

/**
 * Adds computed fields for rendering station syndication info.
 * @param {Object} data
 */
function renderStationSyndication(data) {
  const syndicatedStations = (data.stationSyndication || [])
    .filter(syndication => syndication.source === 'manual syndication');

  data._computed.stationSyndicationCallsigns = syndicatedStations
    .map(station => station.callsign)
    .sort()
    .join(', ');
}

/**
 * Adds slug to each item in station syndication field.
 * @param {Object} data
 */
function addStationSyndicationSlugs(data) {
  updateStationSyndicationType(data);

  data.stationSyndication = data.stationSyndication
    .map(station => {
      // if the station is national, there must be a primary section front. otherwise, the slug must just be truthy
      const shouldSetSlug = station.stationSlug === DEFAULT_STATION.site_slug ? station.sectionFront : station.stationSlug;

      if (shouldSetSlug) {
        station.syndicatedArticleSlug = generateSyndicationSlug(data.slug, station);
      } else {
        delete station.syndicatedArticleSlug;
      }
      return station;
    });
}

function doNotPublishToANF(data) {
  if (data.feeds && (data.stationSlug || data.isCloned)) {
    data.feeds = {
      ...data.feeds,
      'apple-news': false
    };
  }
}

function render(ref, data, locals) {
  fixModifiedDate(data);
  addStationLogo(data, locals);
  upCaseRadioDotCom(data);
  renderFullWidthLead(data, locals);
  addTwitterHandle(data, locals);
  renderStationSyndication(data);
  doNotPublishToANF(data);

  if (locals && !locals.edit) {
    return data;
  }

  return promises.props({
    past: circulationService.getRollingStandoutArticles(locals, { shouldDedupeContent: true }),
    publishedData: getPublishedData(ref, data, locals)
  }).then(function (resolved) {
    circulationService.setGoogleStandoutHelpers(data, resolved.publishedData, resolved.past.length);
    return data;
  });
}

/**
 * Assigns 'stationSlug' and 'stationName' to data.
 *
 * newPageStation should only exist upon creating a new page.  The property is
 *   attached to locals in `app/routes/add-endpoint/create-page.js`.  Its
 *   purpose is to avoid creating a new content-type instance for every station
 *   (article/gallery/section front/etc.)
 *
 * @param {string} uri
 * @param {object} data
 * @param {object} locals
 */
function assignStationInfo(uri, data, locals) {
  if (locals.newPageStation !== undefined) {
    const station = locals.newPageStation,
      componentName = getComponentName(uri);

    Object.assign(data, {
      stationSlug: station.site_slug,
      stationName: station.name,
      stationCallsign: station.callsign,
      stationTimezone: station.timezone
    });

    if (articleOrGallery.has(componentName)) {
      Object.assign(data, {
        stationLogoUrl: station.square_logo_small,
        stationURL: station.website
      });
    }
  } else {
    if (data.contentType === PAGE_TYPES.CONTEST) {
      Object.assign(data, {
        stationCallsign: _get(data, 'stationCallsign', 'NATL-RC'),
        stationTimezone: _get(data, 'stationTimezone', 'ET')
      });
    }
  }
}

async function save(uri, data, locals) {
  const isClient = typeof window !== 'undefined',
    componentName = getComponentName(uri);

  /*
    kiln doesn't display custom error messages, so on the client-side we'll
    use the publishing drawer for validation errors.
  */
  if (!isClient && await urlExists(uri, data, locals)) {
    throw new Error('duplicate url');
  }

  // first, let's get all the synchronous stuff out of the way:
  // sanitizing inputs, setting fields, etc
  assignStationInfo(uri, data, locals);
  sanitizeInputs(data); // do this before using any headline/teaser/etc data
  standardizePageData(data, componentName);
  generatePrimaryHeadline(data);
  generatePageTitles(data, locals);
  generatePageDescription(data);
  formatDate(data, locals);
  setCanonicalUrl(data, locals);
  cleanSiloImageUrl(data);
  bylineOperations(data);
  setNoIndexNoFollow(data);
  setFullWidthLead(data);

  // we need to get stations by editorial feeds before creating slugs for syndicated content
  await addStationsByEditorialGroup(data, locals);
  // we need apply content subscriptions before creating slugs for syndicated content
  await applyContentSubscriptions(data, locals);
  addStationSyndicationSlugs(data);

  // now that we have some initial data (and inputs are sanitized),
  // do the api calls necessary to update the page and authors list, slug, and feed image
  return promises.props({
    prevData: data ? getPrevData(uri, data, locals) : {},
    publishedData: data ? getPublishedData(uri, data, locals) : {}
  }).then(function (resolved) {
    // once async calls are done, use their resolved values to update some more data
    setSlugAndLock(data, resolved.prevData, resolved.publishedData);
    return data;
  });
}

module.exports = {
  addStationSyndicationSlugs,
  assignStationInfo,
  render,
  save,
  setNoIndexNoFollow,
  updateStationSyndicationType
};
