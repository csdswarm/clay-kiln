'use strict';

const _ = require('lodash'),
  socialsByline = require('./socials-byline');

/**
 * Comma separate a list of author strings
 * or simple-list objects
 *
 * @param  {Array} authorsList
 * @param  {Array} hostsList
 * @param  {Array} sourcesList
 * @return {String}
 */
function formatSimpleByline(authorsList, hostsList, sourcesList) {
  const authors = _.map(authorsList, (author) => _.isObject(author) ? author.text : author),
    hosts = _.map(hostsList, (host) => _.isObject(host) ? host.text : host),
    sources = _.map(sourcesList, (source) => _.isObject(source) ? source.text : source),
    list = [...authors, ...hosts, ...sources];

  if (list.length === 1) {
    return '<span>' + list[0] + '</span>';
  } else if (list.length === 2) {
    return '<span>' + list[0] + '</span><span class="and"> and </span><span>' + list[1] + '</span>';
  } else {
    return _.join(_.map(list, function (author, idx) {
      if (idx < list.length - 1) {
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
    options = _.pick(opts.hash, [
      'showSocial',
      'authorHost',
      'linkClass',
      'nameClass',
      'hideLinks',
      'simpleList',
      'stationSlug',
      'siteSlug',
      'isContentFromAP'
    ]);

  let names, hosts, sources;

  if (options.simpleList) {
    return options.hideLinks ? formatSimpleByline(bylines) : socialsByline.formatNumAuthorsHosts(bylines, options);
  }

  return _.join(_.reduce(bylines, (acc, byline, idx) => {
    names = _.get(byline, 'names', []);
    hosts = _.get(byline, 'hosts', []);
    hosts = _.map(hosts, (host) => ({ ...host, isHost: true })),
    sources = _.get(byline, 'sources', []),
    sources = _.map(sources, (source) => ({ ...source, isSource: true }));

    if (names.length > 0 || hosts.length > 0 || sources.length > 0) {
      acc.push(`<span>${idx === 0 ? _.capitalize(byline.prefix) : byline.prefix} </span> ${options.hideLinks ? formatSimpleByline(names, hosts, sources) : socialsByline.formatNumAuthorsHosts(names, hosts, sources, options)}`);
    }

    return acc;
  }, []), ' ');
}

module.exports = complexByline;
module.exports.byline = formatSimpleByline;
