'use strict';

const _forEach = require('lodash/forEach'),
  _find = require('lodash/find'),
  _get = require('lodash/get'),
  _includes = require('lodash/includes'),
  mime = require('mime'),
  { getComponentName } = require('clayutils'),
  { getRawMetadata, getRenditionUrl, cleanUrl } = require('../../../services/universal/media-play'),
  { renderComponent } = require('../../../services/startup/feed-components');

/**
 * takes in an array of content objects ({ data: JSON, _ref: componentUrl }) and creates the html for that component.
 * finds the component type from parsing the componentUrl from _ref
 *
 * @param {Array} content
 * @param {Object} locals
 * @param {string} format
 * @param {Set<string>} [componentsToSkip = new Set()] - component names to skip rendering
 * @returns {String}
 */
async function renderContent(content, locals, format, componentsToSkip = new Set()) {
  let res = '';

  for (const cmpt of content) {
    const ref = _get(cmpt, '_ref', ''),
      cmptData = JSON.parse(_get(cmpt, 'data', '{}')),
      match = ref.match(/_components\/([^\/]+)\//);

    if (
      match
      && cmptData
      && match[1] !== 'inline-related'
      && !componentsToSkip.has(match[1])
    ) {
      // render the component and add it to the response
      res += await renderComponent(match[1], ref, cmptData, locals, format);
    }
  }

  return res;
}

/**
 * Find the MIME type for a file
 *
 * @param {String} url
 * @returns {String}
 */
function getMimeType(url) {
  url = cleanUrl(url);
  return mime.lookup(url);
}

/**
 * Grab the first component in a component list
 * who it of a type
 *
 * @param  {Array}  content
 * @param  {String} cmptName
 * @return {Object}
 */
function firstAndParse(content, cmptName) {
  const cmpt = _find(content, filterByComponentName(cmptName));

  return cmpt && parseComponentData(cmpt);
}

/**
 * Returns a function that checks for a component name.
 *
 * @param {string} componentName
 * @returns {function({ref: string}): boolean}
 */
function filterByComponentName(componentName) {
  return ({ ref }) => getComponentName(ref) === componentName;
}

/**
 * Returns a function that checks for many component names.
 *
 * @param {string[]} componentNames
 * @returns {function({ref: string}): boolean}
 */
function filterByComponentNames(componentNames) {
  return ({ ref }) => _includes(componentNames, getComponentName(ref));
}

/**
 * Filters a component list by component name.
 *
 * @param {object[]} content
 * @param {string} cmptName
 * @returns {object}
 */
function filterAndParse(content, cmptName) {
  return content.filter(filterByComponentName(cmptName))
    .map(parseComponentData);
}

function filterByManyAndParse(content, cmptNames) {
  return content.filter(filterByComponentNames(cmptNames))
    .map(parseComponentData);
}

/**
 * Parses component's data to JS object.
 *
 * @param {string} ref
 * @param {string} data
 * @returns {object}
 */
function parseComponentData({ ref, data }) {
  const parsedData = JSON.parse(data);

  parsedData._ref = ref;

  return parsedData;
}

/**
 * Given an array of string that map to one property,
 * loop through and add them
 *
 * @param {Object} data
 * @param {String} property
 * @param {Array} transform
 */
function addArrayOfProps(data, property, transform) {
  _forEach(data, function (item) {
    const obj = {};

    obj[`${property}`] = item;
    transform.push(obj);
  });
}

/**
 * Given some image url add an RSS media content tag setup for it
 *
 * @param {{url: String}} image
 * @param {Object[]} transform
 * @return {Promise<Object[]>}
 */
function addRssMediaImage(image, transform) {
  if (!image) return Promise.resolve(); // If a mediaplay image isn't in the content, escape TODO: Make this better. Use images in ledes, basic image, etc, but find something

  return getRawMetadata(image.url)
    .then(function (meta) {
      const imageContent = [
        { _attr: { url: image.url } }
      ];

      if (meta.credit) imageContent.push({ 'media:credit': meta.credit });
      if (meta.copyright) imageContent.push({ 'media:copyright': meta.copyright });
      if (meta.caption) imageContent.push({ 'media:title': meta.caption });

      transform.push({ 'media:content': imageContent });
    });
}

/**
 * Assemble a video media:content element along with its related child elements
 *
 * @param {{videoId: string, videoDuration: number, title: string, description: string, thumbnailUrl: string}} video
 * @param {Object[]} defaultMediaContent
 * @param {Object[]} transform
 */
function addRssMediaVideo(video, defaultMediaContent, transform) {
  const currYear = new Date().getFullYear(),
    { title, description, thumbnailUrl } = video,
    mediaContent = [
      { 'media:title': title },
      { 'media:description': description },
      {
        'media:thumbnail': {
          _attr: {
            url: getRenditionUrl(thumbnailUrl, { w: 1920, h: 1080 }, true),
            type: getMimeType(thumbnailUrl)
          }
        }
      },
      { 'media:copyright': `\u00A9 ${currYear}, New York Media LLC` }
    ];

  transform.push({ 'media:content': defaultMediaContent.concat(mediaContent) });
}

/**
 * Gets content from Elastic published content index documents.
 *
 * @param {object} data
 * @return {object[]}
 */
function getContent(data) {
  return data.content || data.relatedInfo || [];
}

module.exports.renderContent = renderContent;
module.exports.renderComponent = renderComponent;
module.exports.getContent = getContent;
module.exports.firstAndParse = firstAndParse;
module.exports.addArrayOfProps = addArrayOfProps;
module.exports.addRssMediaImage = addRssMediaImage;
module.exports.addRssMediaVideo = addRssMediaVideo;

// exposed for testing
module.exports.getMimeType = getMimeType;
module.exports.addArrayOfProps = addArrayOfProps;
module.exports.filterAndParse = filterAndParse;
module.exports.filterByComponentNames = filterByComponentNames;
module.exports.filterByManyAndParse = filterByManyAndParse;
module.exports.firstAndParse = firstAndParse;
module.exports.parseComponentData = parseComponentData;
