'use strict';

const h = require('highland'),
  { logSuccess, logError } = require('../helpers/log-events'),
  { addSiteAndNormalize } = require('../helpers/transform'),
  { filters, helpers, elastic, subscribe } = require('amphora-search'),
  { isOpForComponents, stripPostProperties } = require('../filters'),
  db = require('../../services/server/db'),
  INDEX = helpers.indexWithPrefix('published-content', process.env.ELASTIC_PREFIX),
  CONTENT_FILTER = isOpForComponents(['article', 'gallery']),
  log = require('../../services/universal/log').setup({ file: __filename });

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
    .map(({ _ref }) => h(db.get(_ref).then( data => ({ _ref, data: JSON.stringify(data) }) ))) // Run each _ref through a get, but return a Promise wrapped in a Stream
    .parallel(1) // Merge each individual stream into the bigger stream
    .collect() // Turn each individual object into an array of objects
    .map(resolvedContent => {
      log('info', `PUB-TEST: In resolvedContent`, {resolvedContent})
      obj.value[param] = resolvedContent; // Assign the array of resolved objects to the original property
      return obj; // Return the original, now modified object
    });
}

/**
 * attaches data for each _ref in slideEmbed
 *
 * @param {Object} slides
 *
 * @returns {Stream}
 */
function getSlideEmbed(slides) {
  return h(slides)
    .map( slide => {
      const slideData = JSON.parse(slide.data);

      return h(slideData.slideEmbed)
        .map(({ _ref }) => h(db.get(_ref).then( data => ({ _ref, data: data }) ))) // Run each _ref through a get, but return a Promise wrapped in a Stream
        .parallel(1) // make sure embeds come back in order
        .collect()
        .map(resolvedContent => {
          slideData.slideEmbed = resolvedContent;
          // data for some reason needs to be a string or elasticsearch throws a parse error
          slide.data = JSON.stringify(slideData);
          return slide;
        });
    })
    .parallel(1) // bring all slides back together, parallel ensures order
    .map( slide => {
      const slideData = JSON.parse(slide.data);

      // description is an empty array if there isn't anything
      return slideData.description && slideData.description.length > 0 ? h(slideData.description)
        .map(({ _ref }) => h(db.get(_ref).then( data => ({ _ref, data: data }) ))) // Run each _ref through a get, but return a Promise wrapped in a Stream
        .parallel(1) // make sure descriptions come back in order
        .collect()
        .map(resolvedContent => {
          slideData.description = resolvedContent;
          // data for some reason needs to be a string or elasticsearch throws a parse error
          slide.data = JSON.stringify(slideData);
          return slide;
        }) : h.of(slide);
    })
    .parallel(1) // bring all slides back together, 1 at a time, but parallel ensures order
    .collect(); // Turn back into an array of slides
}

/**
 * Takes an Article obj and attaches the data attribute for each _ref for each slide and also slideEmbed
 *
 * @param {Object} obj
 *
 * @returns {Stream}
 */
function getSlides(obj) {
  return getContent(obj, 'slides')
  // returns an object because we're still part of the stream created in getContent, no parent stream to merge into
    .map( ({ value }) => getSlideEmbed(value.slides))
    // merge stream from getSlideEmbed into getContent stream
    .parallel(1)
    .map( resolvedContent => {
      obj.value.slides = resolvedContent;
      return obj;
    });
}

function save(stream) {
  return stream
    .parallel(1)
    .filter(CONTENT_FILTER)
    .filter(filters.isInstanceOp)
    .filter(filters.isPutOp)
    .filter(filters.isPublished)
    .map(helpers.parseOpValue) // resolveContent is going to parse, so let's just do that before hand
    // Return an object wrapped in a stream but either get the stream from `getArticleContent` or just immediately wrap the object with h.of
    .map(param => param.key.indexOf('article') >= 0 || param.key.indexOf('gallery') >= 0 ? getContent(param, 'content') : h.of(param))
    // merge all content streams into main stream
    .parallel(1) // Merge each individual stream into the bigger stream --> this turns the stream back into the article obj
    // get data content for slides
    .map(param => param.key.indexOf('gallery') >= 0 ? getSlides(param) : h.of(param))
    // merge all slides streams into main stream
    .parallel(1) // Arbitrary number here, just wanted a matching limit
    // add data for lead
    .map(param => getContent(param, 'lead'))
    .parallel(1)
    .map(stripPostProperties)
    .through(addSiteAndNormalize(INDEX)) // Run through a pipeline
    .flatten()
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
function send(op) {
  log('info', `PUB-TEST: sending update to elastic: ${INDEX}, ${op.key}`);
  return h(elastic.update(INDEX, op.key, op.value, false, true).then(() => op.key));
}

/**
 * Index articles/galleries on publish
 * @param  {Object} args
 * @returns {Promise}
 */
module.exports.unpublish = require('../helpers/unpublish')(INDEX, CONTENT_FILTER);
