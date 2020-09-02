'use strict';

const socialSvgs = require('./social-svgs'),
  slugifyService = require('./slugify'),
  twitterHtml = (authorData) => `<a href="http://twitter.com/${authorData.twitter}" target='_blank' class="author-socials"><span class="author-socials-icon twitter">${socialSvgs.TWITTER}</span><span>@${authorData.twitter}</span></a>`,
  fbHtml = (authorData) => `<a href="http://facebook.com/${authorData.facebook}" target='_blank' class="author-socials"><span class="author-socials-icon facebook">${socialSvgs.FACEBOOK}</span><span>@${authorData.name.toLowerCase().replace(/\s/g, '')}</span></a>`,
  igHtml = (authorData) => `<a href="http://instagram.com/${authorData.instagram}" target='_blank' class="author-socials"><span class="author-socials-icon instagram">${socialSvgs.INSTAGRAM}</span><span>@${authorData.instagram}</span></a>`;

/**
 * Comma separate authors
 * @param {Object[]} authorsAndMeta e.g. [{name: "Max Read", twitter:"max_read", facebook:"", instagram:""}]
 * @param {Object[]} hostsAndMeta e.g. [{name: "Max Read", twitter:"max_read", facebook:"", instagram:""}]
 * @param {Object} options
 * @param {String} options.authorHost e.g. 'nymag.com'
 * @param {Boolean} options.showSocial
 * @param {String} [options.nameClass]
 * @param {String} [options.linkClass]
 * @return {String}
 */
function formatNumAuthorsHosts(authorsAndMeta, hostsAndMeta, options) {
  const listAndMeta = [...authorsAndMeta, ...hostsAndMeta];

  return listAndMeta.reduce(function (acc, item, index) {
    if (listAndMeta.length === 1) { // only display socials if there is one author
      if (options.showSocial) {
        return acc + createAuthorHostHtml(item, options) + createSocialsHtml(item);
      }
      return acc + createAuthorHostHtml(item, options);
    } else {
      if (index === listAndMeta.length - 1) {
        if (listAndMeta.length === 2) {
          return `${acc}<span> and </span>${createAuthorHostHtml(item, options)}`;
        } else {
          return `${acc}<span>, </span> <span> and </span>${createAuthorHostHtml(item, options)}`;
        }
      } else if (index > 0 && index < listAndMeta.length - 1) {
        return `${acc}<span>, </span>${createAuthorHostHtml(item, options)}`;
      } else {
        return acc + createAuthorHostHtml(item, options);
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
 * Create HTML for the author and host, including
 * link to author/host page and meta-author tags
 * @param  {Object} data
 * @param {Object} options
 * @param {String} options.authorHost e.g. 'nymag.com'
 * @param {Boolean} options.showSocial
 * @param {String} [options.nameClass]
 * @param {String} [options.linkClass]
 * @return {String}
 */
function createAuthorHostHtml(data, options) {
  const nameOrText = data.name || data.text,
    link = slugifyService(nameOrText),
    name = data.isHost ? 'host' : 'author',
    { authorHost, isContentFromAP, linkClass, nameClass, siteSlug, stationSlug } = options,
    slug = isContentFromAP ? siteSlug : stationSlug,
    linkAuthorHostPage = `${authorHost + (slug ? `/${slug}` : '')}/${name}s/${link}`;


  // multiline interpolation doesn't work here because whitespace will get interpreted literally
  return `<span itemprop="${name}" itemscope itemtype="http://schema.org/Person" class="${name}" data-${name}="${nameOrText}">` +
    `<a href="//${linkAuthorHostPage}" rel="author" class="${linkClass ? linkClass : name + '__anchor'}">` +
    `<span${nameClass ? ` class="${nameClass}"` : ''}>${nameOrText}</span>` +
    `<meta itemprop="name" content="${nameOrText}"/>` +
    `<link itemprop="sameAs" href="//${linkAuthorHostPage}"/></a></span>`;
}

// For testing
module.exports.formatNumAuthorsHosts = formatNumAuthorsHosts;
module.exports.createSocialsHtml = createSocialsHtml;
module.exports.createAuthorHostHtml = createAuthorHostHtml;
