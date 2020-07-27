'use strict';

const socialSvgs = require('./social-svgs'),
  { textToEncodedSlug } = require('./utils'),
  twitterHtml = (authorData) => `<a href="http://twitter.com/${authorData.twitter}" target='_blank' class="author-socials"><span class="author-socials-icon twitter">${socialSvgs.TWITTER}</span><span>@${authorData.twitter}</span></a>`,
  fbHtml = (authorData) => `<a href="http://facebook.com/${authorData.facebook}" target='_blank' class="author-socials"><span class="author-socials-icon facebook">${socialSvgs.FACEBOOK}</span><span>@${authorData.name.toLowerCase().replace(/\s/g, '')}</span></a>`,
  igHtml = (authorData) => `<a href="http://instagram.com/${authorData.instagram}" target='_blank' class="author-socials"><span class="author-socials-icon instagram">${socialSvgs.INSTAGRAM}</span><span>@${authorData.instagram}</span></a>`;

/**
 * Comma separate authors
 * @param {Object[]} authorsAndMeta e.g. [{name: "Max Read", twitter:"max_read", facebook:"", instagram:""}]
 * @param {Object} options
 * @param {String} options.authorHost e.g. 'nymag.com'
 * @param {Boolean} options.showSocial
 * @param {String} [options.nameClass]
 * @param {String} [options.linkClass]
 * @return {String}
 */
function formatNumAuthors(authorsAndMeta, options) {
  return authorsAndMeta.reduce(function (acc, item, index) {
    if (authorsAndMeta.length === 1) { // only display socials if there is one author
      if (options.showSocial) {
        return acc + createAuthorHtml(item, options) + createSocialsHtml(item);
      }
      return acc + createAuthorHtml(item, options);
    } else {
      if (index === authorsAndMeta.length - 1) {
        if (authorsAndMeta.length === 2) {
          return `${acc}<span> and </span>${createAuthorHtml(item, options)}`;
        } else {
          return `${acc}<span>, </span> <span> and </span>${createAuthorHtml(item, options)}`;
        }
      } else if (index > 0 && index < authorsAndMeta.length - 1) {
        return `${acc}<span>, </span>${createAuthorHtml(item, options)}`;
      } else {
        return acc + createAuthorHtml(item, options);
      }
    }
  }, '');
}

/**
 * Comma separate hosts
 * @param {Object[]} hostsAndMeta e.g. [{name: "Max Read", twitter:"max_read", facebook:"", instagram:""}]
 * @param {Object} options
 * @param {String} options.authorHost e.g. 'nymag.com'
 * @param {Boolean} options.showSocial
 * @param {String} [options.nameClass]
 * @param {String} [options.linkClass]
 * @return {String}
 */
function formatNumHosts(hostsAndMeta, options) {
  return hostsAndMeta.reduce(function (acc, item, index) {
    if (hostsAndMeta.length === 1) { // only display socials if there is one author
      if (options.showSocial) {
        return acc + createHostHtml(item, options) + createSocialsHtml(item);
      }
      return acc + createHostHtml(item, options);
    } else {
      if (index === hostsAndMeta.length - 1) {
        if (hostsAndMeta.length === 2) {
          return `${acc}<span> and </span>${createHostHtml(item, options)}`;
        } else {
          return `${acc}<span>, </span> <span> and </span>${createHostHtml(item, options)}`;
        }
      } else if (index > 0 && index < hostsAndMeta.length - 1) {
        return `${acc}<span>, </span>${createHostHtml(item, options)}`;
      } else {
        return acc + createHostHtml(item, options);
      }
    }
  }, '');
}

/**
 * Create HTML for the social media handles of the author
 * @param  {Object} authorData
 * @return {String}
 */
function createSocialsHtml(authorData) {
  const social = authorData.socialHandlePreference;
  let socialHtml = '';

  if (authorData[social]) {
    switch (social) {
      case 'twitter':
        socialHtml = twitterHtml(authorData);
        break;
      case 'facebook':
        socialHtml = fbHtml(authorData);
        break;
      case 'instagram':
        socialHtml = igHtml(authorData);
        break;
      default:
        socialHtml = '';
        break;
    }
  } else if (!social) {
    return getSocialHtmlWithoutPreference(authorData);
  }

  return socialHtml;
}

/**
 * getSocialHtmlWithoutPreference
 *
 * There is a chance that the article hasn't been saved since the author upgrade that adds social preference ran,
 * so fallback to using the old priority for social handles
 *
 * @param {Object} authorData
 * @returns {String} Social byline html
 */
function getSocialHtmlWithoutPreference(authorData) {
  if (authorData.twitter) {
    return twitterHtml(authorData);
  } else if (authorData.facebook) {
    return fbHtml(authorData);
  } else if (authorData.instagram) {
    return igHtml(authorData);
  }

  return '';
}

/**
 * Create HTML for the author, including
 * link to author page and meta-author tags
 * @param  {Object} authorData
 * @param {Object} options
 * @param {String} options.authorHost e.g. 'nymag.com'
 * @param {Boolean} options.showSocial
 * @param {String} [options.nameClass]
 * @param {String} [options.linkClass]
 * @return {String}
 */
function createAuthorHtml(authorData, options) {
  const nameOrText = authorData.name || authorData.text,
    link = textToEncodedSlug(nameOrText),
    linkAuthorPage = `${options.authorHost + (options.stationSlug ? `/${options.stationSlug}` : '')}/authors/${link}`;

  // multiline interpolation doesn't work here because whitespace will get interpreted literally
  return `<span itemprop="author" itemscope itemtype="http://schema.org/Person" class="author" data-author="${nameOrText}">` +
    `<a href="//${linkAuthorPage}" rel="author" class="${options.linkClass ? options.linkClass : 'author__anchor'}">` +
    `<span${options.nameClass ? ` class="${options.nameClass}"` : ''}>${nameOrText}</span>` +
    `<meta itemprop="name" content="${nameOrText}"/>` +
    `<link itemprop="sameAs" href="//${linkAuthorPage}"/></a></span>`;
}

/**
 * Create HTML for the host, including
 * link to host page and meta-host tags
 * @param  {Object} hostData
 * @param {Object} options
 * @param {String} options.authorHost e.g. 'nymag.com'
 * @param {Boolean} options.showSocial
 * @param {String} [options.nameClass]
 * @param {String} [options.linkClass]
 * @return {String}
 */
function createHostHtml(hostData, options) {
  const nameOrText = hostData.name || hostData.text,
    link = textToEncodedSlug(nameOrText),
    linkHostPage = `${options.authorHost + (options.stationSlug ? `/${options.stationSlug}` : '')}/hosts/${link}`;

  // multiline interpolation doesn't work here because whitespace will get interpreted literally
  return `<span itemprop="host" itemscope itemtype="http://schema.org/Person" class="host" data-host="${nameOrText}">` +
    `<a href="//${linkHostPage}" rel="host" class="${options.linkClass ? options.linkClass : 'host__anchor'}">` +
    `<span${options.nameClass ? ` class="${options.nameClass}"` : ''}>${nameOrText}</span>` +
    `<meta itemprop="name" content="${nameOrText}"/>` +
    `<link itemprop="sameAs" href="//${linkHostPage}"/></a></span>`;
}

// For testing
module.exports.formatNumAuthors = formatNumAuthors;
module.exports.formatNumHosts = formatNumHosts;
module.exports.createSocialsHtml = createSocialsHtml;
module.exports.createAuthorHtml = createAuthorHtml;
module.exports.createHostHtml = createHostHtml;
