'use strict';

const _ = require('lodash'),
  socialsByline = require('./socials-byline');

/**
 * Comma separate a list of author strings
 * or simple-list objects
 *
 * @param  {Array} authorsList
 * @return {String}
 */
function formatSimpleByline(authorsList) {
  var authors = _.map(authorsList, (author) => _.isObject(author) ? author.text : author);

  if (authors.length === 1) {
    return '<span>' + authors[0] + '</span>';
  } else if (authors.length === 2) {
    return '<span>' + authors[0] + '</span><span class="and"> and </span><span>' + authors[1] + '</span>';
  } else {
    return _.join(_.map(authors, function (author, idx) {
      if (idx < authors.length - 1) {
        return '<span>' + author + ', </span>';
      } else {
        return '<span class="and">and </span><span>' + author + '</span>';
      }
    }), '');
  }
}

/**
 * complexByline
 *
 * @param {Object} opts arguments and context passed from handlebars template
 * @returns {String}
 */
function complexByline(opts) {
  const bylines = _.get(opts.hash, 'bylines', []),
    options = _.pick(opts.hash, ['showSocial', 'authorHost', 'linkClass', 'nameClass', 'hideLinks', 'simpleList']);

  let names;

  if (options.simpleList) {
    return options.hideLinks ? formatSimpleByline(bylines) : socialsByline.formatNumAuthors(bylines, options);
  }

  return _.join(_.reduce(bylines, (acc, byline, idx) => {
    names = _.get(byline, 'names', []);

    if (names.length > 0) {
      acc.push(`<span>${idx === 0 ? _.capitalize(byline.prefix) : byline.prefix} </span> ${options.hideLinks ? formatSimpleByline(names) : socialsByline.formatNumAuthors(names, options)}`);
    }

    return acc;
  }, []), ' ');
}

/**
 * Generate slug from author name
 *
 * @param author
 * @returns {string}
 */
function authorNameToSlug(author) {
  return author.replace(/\s/g, '-').replace(/%2F/g, '/').toLowerCase();
}

/**
 * Generate author name from slug
 *
 * @param author
 * @returns {string}
 */
function slugToAuthorName(author) {
  return author.replace(/-/g, ' ').replace(/\//g,'');
}

module.exports = complexByline;
module.exports.byline = formatSimpleByline;
module.exports.authorNameToSlug = authorNameToSlug;
module.exports.slugToAuthorName = slugToAuthorName;
