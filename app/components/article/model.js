'use strict';

const _get = require('lodash/get'),
  _filter = require('lodash/filter'),
  _includes = require('lodash/includes'),
  _find = require('lodash/find'),
  _unset = require('lodash/unset'),
  _cloneDeep = require('lodash/cloneDeep'),
  striptags = require('striptags'),
  dateFormat = require('date-fns/format'),
  dateParse = require('date-fns/parse'),
  utils = require('../../services/universal/utils'),
  has = utils.has, // convenience
  isFieldEmpty = utils.isFieldEmpty, // convenience
  sanitize = require('../../services/universal/sanitize'),
  promises = require('../../services/universal/promises'),
  rest = require('../../services/universal/rest'),
  circulationService = require('../../services/universal/circulation'),
  mediaplay = require('../../services/universal/media-play'),
  brandingRubricHandlers = require('./branding-rubric-handlers'),
  queryService = require('../../services/server/query'),
  QUERY_INDEX = 'authors';

/**
 * only allow emphasis, italic, and strikethroughs in headlines
 * @param  {string} oldHeadline
 * @returns {string}
 */
function stripHeadlineTags(oldHeadline) {
  let newHeadline = striptags(oldHeadline, ['em', 'i', 'strike']);

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

  if (has(data.overrideHeadline)) {
    data.overrideHeadline = sanitize.toSmartHeadline(stripHeadlineTags(data.overrideHeadline));
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
 * generate the primary headline from the overrideHeadline
 * if the primary headline is empty and the overrideHeadline is less than 80 characters
 * @param  {object} data
 */
function generatePrimaryHeadline(data) {
  if (isFieldEmpty(data.primaryHeadline) && has(data.overrideHeadline) && data.overrideHeadline.length < 80) {
    // note: this happens AFTER overrideHeadline is sanitized
    data.primaryHeadline = data.overrideHeadline;
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
    // if locals and locals.date exists, set the article date (overriding any date already set)
    data.date = dateFormat(locals.date); // ISO 8601 date string
  } else if (has(data.articleDate) || has(data.articleTime)) {
    // make sure both date and time are set. if the user only set one, set the other to today / right now
    data.articleDate = has(data.articleDate) ? data.articleDate : dateFormat(new Date(), 'YYYY-MM-DD');
    data.articleTime = has(data.articleTime) ? data.articleTime : dateFormat(new Date(), 'HH:mm');
    // generate the `date` data from these two fields
    data.date = dateFormat(dateParse(data.articleDate + ' ' + data.articleTime)); // ISO 8601 date string
  }
}

/**
 * set the canonical url from the locals (even if it's already set)
 * @param {object} data
 * @param {object} locals
 */
function setCanonicalUrl(data, locals) {
  if (_get(locals, 'publishUrl')) {
    data.canonicalUrl = locals.publishUrl;
  }
}

/**
 * Calls a rubric handler for a page when certain conditions are met
 * Conditions are contained in an array iterated over in order
 * When the first condition is met, it will use that rubric and stop
 * @param {object} handlers
 * @param {object} data make sure to set a default, so handlers can assume it exists
 * @param {object} locals make sure to set a default, so handlers can assume it exists
 */
function callRubricHandlers(handlers = [], data = {}, locals = {}) {
  let handlerIndex;

  for (handlerIndex = 0; handlerIndex < handlers.length; handlerIndex++) {
    if (handlers[handlerIndex].when(data, locals)) {
      handlers[handlerIndex].handler(data);
      break;
    }
  }
}

/**
 * set graphical branding / tag rubrics
 * @param {object} data
 * @param {object} locals
 */
function setRubrics(data, locals) {
  // always check for the graphical branding rubric
  callRubricHandlers(brandingRubricHandlers, data, locals);
}

/**
 * query elastic to get social media stuff for an author
 * @param {Object} query
 * @param {string} name
 * @returns {Promise}
 */
function getAuthorData(query, name) {
  queryService.addShould(query, { match : { name: name.text } });
  queryService.addMinimumShould(query, 1);
  return queryService.searchByQuery(query)
    .catch(() => name)
    .then( authors => {
      authors.forEach((author) => {
        author.text = author.name;
      });

      return authors;
    });
}

/**
 * get data for first mediaplay image in an article, if it exists
 * @param  {object} data
 * @param {object} locals
 * @return {Promise}
 */
function getMediaplayImage(data, locals) {
  const firstMediaplayImage = has(data.content) && _find(data.content, (component) => _includes(component._ref, 'components/image/'));

  if (firstMediaplayImage) {
    return promises.timeout(rest.get(utils.uriToUrl(firstMediaplayImage._ref, locals)), 1000).catch(() => null); // fail gracefully
  }
}

/**
 * get article's previously-saved data, if it exists
 * note: only grab the data if we're thinking of updating the slug
 * @param  {string} uri
 * @param {object} data
 * @param {object} locals
 * @return {Promise}
 */
function getPrevData(uri, data, locals) {
  if (has(data.seoHeadline) || has(data.shortHeadline) || has(data.slug)) {
    return promises.timeout(rest.get(utils.uriToUrl(utils.replaceVersion(uri), locals)), 1000).catch(() => null); // fail gracefully
  }
}

/**
 * get article's previously-published data, if it exists
 * note: only grab the data if we're thinking of updating the slug
 * @param  {string} uri
 * @param {object} data
 * @param {object} locals
 * @return {Promise}
 */
function getPublishedData(uri, data, locals) {
  if (has(data.seoHeadline) || has(data.shortHeadline) || has(data.slug)) {
    return promises.timeout(rest.get(utils.uriToUrl(utils.replaceVersion(uri, 'published'), locals)), 1000).catch(() => null); // fail gracefully
  }
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
 * generate the slug from the seoHeadline or shortHeadline
 * note: they should already have been sanitized
 * @param  {object} data
 */
function generateSlug(data) {
  if (has(data.seoHeadline)) {
    data.slug = sanitize.cleanSlug(data.seoHeadline);
  } else if (has(data.shortHeadline)) {
    data.slug = sanitize.cleanSlug(data.shortHeadline);
  } // else don't set the slug
}

/**
 * generate and/or lock the slug
 * @param  {object|null} data
 * @param  {object|null} prevData
 * @param  {object} publishedData
 */
function setSlugAndLock(data, prevData, publishedData) {
  if (manualSlugUpdate(data, prevData)) {
    // if you manually updated the slug, sanitize and update it and lock the slug
    data.slug = sanitize.cleanSlug(data.slug);
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
    // if you've already published the article, don't regenerate the slug
    // note: if you publish and manually unlock the slug, it'll stay unlocked
    // until you either manually write a new slug or manually lock the slug again
    data.slugLock = true;
  } else if (isFieldEmpty(data.slugLock) || data.slugLock === false) {
    // if the slug is NOT locked (and no other situation above matches), generate it
    generateSlug(data);
  } // if the slug is locked (and no other situation above matches), do nothing
}

/**
 * Generates feed image from resolved mediaplay-image data or from a lede component image.
 * If feed image hasn't already been set and a lede component publishes one,
 * the feed image will get updated based on that lede component.
 * if feed image hasn't already been set and mediaplay-image has a url, it will generate
 * the feed image based on the mediaplay-image.
 * note: this will only generate the feed image once. if you change the mediaplay-image url
 * or the lede component image, the feed image will not update.
 * You will have to update it manually (using the magic-button).
 * @param  {object} data
 * @param  {object|null} mediaplayImage
 */
// function generateFeedImage(data, mediaplayImage) {
//   mediaplayImage = mediaplayImage || {}; // will be null if no mediaplay image
//   if (isFieldEmpty(data.feedImgUrl) && has(data.imageUrl)) {
//     data.feedImgUrl = mediaplay.getRendition(data.imageUrl, 'og:image');
//   } else if (isFieldEmpty(data.feedImgUrl) && has(mediaplayImage.url)) {
//     // get the original rendition from the mediaplay url
//     data.feedImgUrl = mediaplay.getRendition(mediaplayImage.url, 'og:image');
//   } else if (has(data.feedImgUrl)) {
//     // make sure the feed image is using the original rendition
//     data.feedImgUrl = mediaplay.getRendition(data.feedImgUrl, 'og:image');
//   }
// }


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
 * This is a NYMag legacy thing. We converted the original 
 * `authors` array into a more complex `byline` structure, 
 * but we still key a lot of things off the flatter `authors`
 * array. That's why we're doing this work, but it's done
 * on save as to not affect rendering
 */
function setPlainAuthorsList(data) {
  const bylineList = _get(data, 'byline', []),
    authors = [];

  if (bylineList.length > 0) {
    bylineList.forEach((byline) => {
      if (byline.names) {
        byline.names.forEach((name) => {
          authors.push(name);
        });
      }
    });

    data.authors = authors;
  }
}

/**
 * Good for when you have a byline array but one
 * of the objects inside the byline has no name.
 * The byline formatter handlebars helper doesn't 
 * like this usecase, so we should sanitize before
 * it even has to deal with it.
 */
function sanitizeByline(data) {
  const byline = _get(data, 'byline', []);
  
  data.byline = byline.filter(entry => !!entry.names);
}

module.exports.render = function (ref, data, locals) {
  if (locals && !locals.edit) {
    return data;
  }

  return promises.props({
    past: circulationService.getRollingStandoutArticles(locals),
    publishedData: getPublishedData(ref, data, locals)
  }).then(function (resolved) {
    circulationService.setGoogleStandoutHelpers(data, resolved.publishedData, resolved.past.length);
    return data;
  });
};

module.exports.save = function (uri, data, locals) {
  var query = queryService(QUERY_INDEX, locals);

  // first, let's get all the synchronous stuff out of the way:
  // sanitizing inputs, setting fields, etc
  sanitizeInputs(data); // do this before using any headline/teaser/etc data
  generatePrimaryHeadline(data);
  generatePageTitles(data, locals);
  generatePageDescription(data);
  formatDate(data, locals);
  setCanonicalUrl(data, locals);
  setRubrics(data, locals);
  cleanSiloImageUrl(data);
  setPlainAuthorsList(data);
  sanitizeByline(data);

  // now that we have some initial data (and inputs are sanitized),
  // do the api calls necessary to update the page and authors list, slug, and feed image
  return promises.props({
    prevData: getPrevData(uri, data, locals),
    publishedData: getPublishedData(uri, data, locals)
  }).then(function (resolved) {
    // once async calls are done, use their resolved values to update some more data
    setSlugAndLock(data, resolved.prevData, resolved.publishedData);

    return data;
  });
};
