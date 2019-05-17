'use strict';

const _find = require('lodash/find'),
  { getComponentName } = require('clayutils'),
  { checkApproved } = require('./approved-authors'),
  parsers = [
    { component: 'clay-paragraph', fn: paragraph },
    { component: 'blockquote', fn: blockquote },
    { component: 'clay-tweet', fn: social },
    { component: 'image', fn: image },
    { component: 'youtube', fn: youtube },
    { component: 'clay-subheader', fn: subheader },
    { component: 'product', fn: product },
    { component: 'clay-facebook-post', fn: social },
    { component: 'product-image-hotspot', fn: productImageHotSpot }
  ];

/**
 * Returns the corresponding social network element
 *
 * @param {Object} data The data to retrieve the social network element
 * @returns {string} A string of the social network element
 */
function social(data) {
  return data.html;
}

/**
 * Returns an `iframe` element with a youtube URL
 * to the video
 *
 * @param {Object} data The data to retrieve the video id
 * @returns {string} An `iframe` element as a string
 */
function youtube(data) {
  return `<iframe width="560" height="315" src="//www.youtube.com/embed/${data.videoId}" frameborder="0"></iframe>`;
}

/**
 * Returns an `img` element with the required attributes
 * of the image
 *
 * @param {Object} data The data to retrieve the image information
 * @returns {string} An `img` element as a string
 */
function image(data) {
  const creditProp = data.imageCreditOverride || data.imageCredit,
    creditApproved = checkApproved(creditProp);

  if (!creditApproved) {
    return '';
  }

  return `<figure><img src="${data.imageUrl}" /><figcaption>${data.imageCaption || ''}<span class="copyright">${creditProp || ''}</span></figcaption></figure>`;
}

/**
 * Returns a `blockquote` element with text in it
 *
 * @param {Object} data The data to retrieve the text
 * @returns {string} A `blockquote` element as a string
 */
function blockquote(data) {
  return `<blockquote>${data.text}</blockquote>`;
}

/**
 * Returns a `p` element with text in it
 *
 * @param {Object} data The data to retrieve the text
 * @returns {string} A `p` element as a string
 */
function paragraph(data) {
  return `<p>${data.text}</p>`;
}

/**
 * Returns a `h2` element with text in it
 *
 * @param {Object} data The data to retrieve the text
 * @return {string} A `h2` element as a string
 */
function subheader(data) {
  return `<h2>${data.text}</h2>`;
}

/**
 * Returns a `section` element with a header, description and image
 *
 * @param {Object} data
 * @return {string}
 */
function product(data) {
  let productSection = `<section><h2>${data.name}</h2>`;

  productSection += data.imageUrl
    ? `<img src="${data.imageUrl}" alt="${data.imageCaption || ''}" data-portal-copyright="${data.imageCredit || ''}">`
    : '';
  productSection += `<p>Vendor: <span>${data.vendor}</span></p>`;
  productSection += `<p>Price: <span>$${data.priceLow}</span></p>`;
  productSection += `<a href="${data.buyUrl}">Buy</a></section>`;

  return productSection;
}

/**
 * Returns a `section` element with a header, description and image
 *
 * @param {Object} data
 * @return {string}
 */
function productImageHotSpot(data) {
  return `<section><h2>${data.title || ''}</h2><img src="${data.imageUrl || ''}"><p>${data.body || ''}</p></section>`;
}

/**
 * Formats a component data into an HTML tag
 *
 * @param {Object} component Contains the data and ref of the component
 * @return {string} A formatted html tag as a string
 */
function formatContent(component) {
  const cmptName = getComponentName(component.ref),
    parser = _find(parsers, parser => parser.component === cmptName);

  if (!parser) {
    return '';
  }

  return parser.fn(component.data);
}

/**
 * Returns a string containing the mapped content info
 *
 * @param {string} acc The accumulated result
 * @param {Object} next The next object to be processed
 * @returns {string} A string with mapped elements
 */
function mergeContent(acc, next) {
  return `${acc}${formatContent(next)}`;
}

/**
 * Returns an array with the author name wrapped
 * inside a `name` property
 *
 * @param {Array} authors The array of authors name
 * @returns {Object[]} A new array with the wrapped items
 */
function wrapAuthorProp(authors) {
  return authors.map(author => ({ author: [{ name: author }] }));
}

/**
 * Returns an array with the category name wrapped
 * inside an object as an attribute
 *
 * @param {Array} tags The array of tags
 * @returns {Object[]} A new array with the wrapped items
 */
function wrapCategoryProp(tags) {
  return tags.map(tag => ({ category: { _attr: { term: tag } } }));
}

/**
 * Returns a collection of `media:content` objects
 *
 * @param {Object} data The data provided by the image collection component
 * @returns {Object[]} An array of structured `media:content` objects
 */
function mapImageCollection({ imageCollection, sharedCaption, sharedCredit }) {
  return imageCollection.map(image => {
    const caption = image.imageCaption || sharedCaption,
      credit = image.imageCredit || sharedCredit;

    return {
      'media:content': [
        { _attr: { url: image.imageUrl } },
        { 'media:title': caption },
        { 'media:credit': credit }
      ]
    };
  });
}

function buildLedeImage({ ledeImgUrl, ledeCredit, ledeCaption }) {
  return image({
    imageCredit: ledeCredit,
    imageCaption: ledeCaption,
    imageUrl: ledeImgUrl
  });
}

module.exports = {
  buildLedeImage,
  mapImageCollection,
  mergeContent,
  wrapAuthorProp,
  wrapCategoryProp
};
