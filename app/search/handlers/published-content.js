'use strict';

const h = require('highland'),
  { logSuccess, logError } = require('../helpers/log-events'),
  { addSiteAndNormalize } = require('../helpers/transform'),
  { filters, helpers, elastic, subscribe } = require('amphora-search'),
  { isOpForComponents, stripPostProperties } = require('../filters'),
  ioredis = require('ioredis'),
  redis = new ioredis(process.env.REDIS_HOST),
  INDEX = helpers.indexWithPrefix('published-content', process.env.ELASTIC_PREFIX),
  CONTENT_FILTER = isOpForComponents(['article', 'gallery']);

// Subscribe to the publish stream
subscribe('publish').through(save);
// Subscribe to the save stream
subscribe('save').through(save);

/**
 * Takes an Article obj and attaches the data attribute for each _ref for a given parameter
 * 
 * @param {Object} obj 
 * @param {String} param 
 * 
 * @returns {Stream}
 */
function getContent(obj, param) {
  const content = obj.value[param];

  return h(content)
    .map(({ _ref }) => h(redis.hget('mydb:h', _ref).then( data => ({ _ref, data }) ))) // Run each _ref through a get, but return a Promise wrapped in a Stream
    .mergeWithLimit(1) // Merge each individual stream into the bigger stream
    .collect() // Turn each individual object into an array of objects
    .map(resolvedContent => {
      obj.value[param] = resolvedContent; // Assign the array of resolved objects to the original property
      return obj; // Return the original, now modified object
    });
}

function getSlideEmbed(slides) {
  return h(slides)
    .map( slide => {
      let slideData = JSON.parse(slide.data);
      return h(slideData.slideEmbed)
        .map(({ _ref }) => h(redis.hget('mydb:h', _ref).then( data => ({ _ref, data: JSON.parse(data) }) ))) // Run each _ref through a get, but return a Promise wrapped in a Stream
        .mergeWithLimit(1)
        .collect()
        .map(resolvedContent => {
          slideData.slideEmbed = resolvedContent;
          slide.data = slideData;
          // slide.data.slideEmbed = resolvedContent;
          return slide;
        });
    })
    .mergeWithLimit(1) // Merge each individual stream into the bigger stream
    .collect() // Turn each individual object into an array of objects
    .map(resolvedContent => {
      slides = resolvedContent; // Assign the array of resolved objects to the original property
      return slides; // Return the original, now modified object
    });
}

function getSlides(obj) {
  return getContent(obj, 'slides')
    // .tap(i => { console.log('hello world'); console.log(i); })
    // .mergeWithLimit(25)
    .map( ({ value }) => getSlideEmbed(value.slides))
    // .tap(i => { console.log(i); })
    .mergeWithLimit(1)
    .collect()
    .map( resolvedContent => {
      obj.value.slides = resolvedContent;
      return obj;
    });
    // .mergeWithLimit(25)
    // .map( slides => { console.log(slides); obj.slides = slides; return h.of(param) });
}

function save(stream) {
  return stream
    .parallel(25)
    .filter(CONTENT_FILTER)
    .filter(filters.isInstanceOp)
    .filter(filters.isPutOp)
    .filter(filters.isPublished)
    .map(helpers.parseOpValue) // resolveContent is going to parse, so let's just do that before hand
    // Return an object wrapped in a stream but either get the stream from `getArticleContent` or just immediately wrap the object with h.of
    .map(param => param.key.indexOf('article') >= 0 || param.key.indexOf('gallery') >= 0 ? getContent(param, 'content') : h.of(param))
    .mergeWithLimit(25) // Merge each individual stream into the bigger stream --> this turns the stream back into the article obj
    // get data content for slides
    .map(param => param.key.indexOf('gallery') >= 0 ? getSlides(param) : h.of(param))
    .mergeWithLimit(25) // Arbitrary number here, just wanted a matching limit
    .map(stripPostProperties)
    .through(addSiteAndNormalize(INDEX)) // Run through a pipeline
    .tap(i => { console.log('hello world'); console.log(i); })
    .flatMap(send)
    .errors(logError)
    .each(logSuccess(INDEX));
}

/**
 * Send the data to Elastic
 *
 * @param  {Array} ops
 * @return {Function}
 */
function send([ op ]) {
  return h(elastic.update(INDEX, op.key, op.value, false, true).then(() => op.key));
}

/**
 * Index articles/galleries on publish
 * @param  {Object} args
 * @returns {Promise}
 */
module.exports.unpublish = require('../helpers/unpublish')(INDEX, CONTENT_FILTER);
