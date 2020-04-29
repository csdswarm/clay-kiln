'use strict';

const h = require('highland'),
  { logSuccess, logError } = require('../helpers/log-events'),
  { addSiteAndNormalize } = require('../helpers/transform'),
  { filters, helpers, elastic, subscribe } = require('amphora-search'),
  { isOpForComponents, stripPostProperties } = require('../filters'),
  db = require('../../services/server/db'),
  INDEX = helpers.indexWithPrefix('published-content', process.env.ELASTIC_PREFIX),
  { PAGE_TYPES } = require('../../services/server/publish-utils'),
  CONTENT_FILTER = isOpForComponents([PAGE_TYPES.ARTICLE, PAGE_TYPES.GALLERY, PAGE_TYPES.CONTEST]);

// Subscribe to the save stream
subscribe('save').through(save);
// Subscribe to the delete stream
subscribe('unpublishPage').through(unpublishPage);

/**
 * Takes an obj and attaches the data attribute for each _ref for a given parameter
 *
 * @param {Object} obj
 * @param {String} param
 * @param {Object} components
 * @param {Function} [transform]
 *
 * @returns {Object}
 */
function getContent(obj, param, components, transform = (data) => data ) {
  const content = obj[param],
    getData = (ref) => components.find(item => item.key === ref).value,
    addData = (component) => ({ ...component, data: transform(getData(component._ref)) });

  // add a key with the data to each ref object
  obj[param] = Array.isArray(content) ? content.map(addData) : addData(content);

  // return a new copy
  return { ...obj };
}

/**
 * attaches data for each _ref in slideEmbed
 *
 * @param {Object} slides
 * @param {Object} components
 *
 * @returns {Object}
 */
function getSlideEmbed(slides, components) {
  slides.map( slide => {
    // helpers.parseOpValue created an object for each main key, but it does not do sub keys
    // which is why we need to parse this and then stringify it again
    const slideData = JSON.parse(slide.data),
      transform = (data) => JSON.parse(data);

    slideData.slideEmbed = getContent(slideData, 'slideEmbed', components, transform).slideEmbed;
    slideData.description = getContent(slideData, 'description', components, transform).description;

    slide.data = JSON.stringify(slideData);
  });

  return slides;
}

/**
 * Takes an obj and attaches the data attribute for each _ref as needed
 *
 * @param {Object} obj
 * @param {Object} components
 *
 * @returns {Object}
 */
function processContent(obj, components) {
  obj.value = getContent(obj.value, 'lead', components);
  obj.value = getContent(obj.value, 'content', components);
  obj.value = getContent(obj.value, 'tags', components);

  if (obj.key.includes('article')) {
    obj.value = getContent(obj.value, 'feedImg', components);
  } else if (obj.key.includes('gallery')) {
    obj.value = getContent(obj.value, 'slides', components);
    obj.value.slides = getSlideEmbed(obj.value.slides, components);

    obj.value = getContent(obj.value, 'footer', components);
  }

  // ensure dateModified is always set
  obj.value.dateModified = obj.value.dateModified || (new Date()).toISOString();

  return obj;
}

/**
 * Transforms authors and tags objects into display names.
 * This must be done because ElasticSearch expects an array of strings for tags and authors, which should be their display names.
 *
 * @param {object} op
 * @returns {object}
 */
function transformAuthorsAndTags(op) {
  const extractText = obj => obj.text;

  if (op.value.authors) {
    op.value.authors = op.value.authors.map(extractText);
  }

  if (op.value.tags) {
    const data = JSON.parse(op.value.tags.data);

    if (data && data.items) {
      op.value.tags = data.items.map(extractText);
    }
  }

  return op;
}

function save(stream) {
  let components = [];

  return stream
    .parallel(1)
    // copy the data being saved so we can search it
    .map(param => { components.push(param); return param; })
    // only bring back articles, galleries, and contest pages
    .filter(CONTENT_FILTER)
    .filter(filters.isInstanceOp)
    .filter(filters.isPutOp)
    .filter(filters.isPublished)
    .map(helpers.parseOpValue) // resolveContent is going to parse, so let's just do that before hand
    .map(obj => processContent(obj, components))
    .map(stripPostProperties)
    .map(transformAuthorsAndTags)
    .through(addSiteAndNormalize(INDEX)) // Run through a pipeline
    .tap(() => { components = []; }) // Clear out the components array so subsequent/parallel running saves don't have reference to this data
    .flatten()
    .flatMap(send)
    .errors(logError)
    .each(logSuccess(INDEX));
}

/**
 * Send the data to Elastic
 *
 * @param  {Object} op
 * @return {Function}
 */
function send(op) {
  return h(elastic.update(INDEX, op.key, op.value, false, true).then(() => op.key));
}

/**
 * Remove the data in Elastic
 *
 * @param  {String} key
 * @return {Stream<Promise<String>>}
 */
function removePublished(key) {
  const publishedKey = `${key}@published`;

  return h(elastic.del(INDEX, publishedKey).then(() => publishedKey));
}

/**
 * Gets the main content from a unpublished object
 *
 * @param {Object} op
 * @return {Stream<Promise<String>>}
 */
function getMain(op) {
  return h(db.get(op.uri).then( data => data.main[0]));
}

/**
 * remove the published article/gallery/contest from elasticsearch
 *
 * @param {Stream} stream
 * @return {Stream}
 */
function unpublishPage(stream) {
  return stream.flatMap(getMain)
    .flatMap(removePublished)
    .errors(logError)
    .each(logSuccess(INDEX));
}

/**
 * Index articles/galleries/contests on publish
 * @param  {Object} args
 * @returns {Promise}
 */
module.exports.unpublish = require('../helpers/unpublish')(INDEX, CONTENT_FILTER);
