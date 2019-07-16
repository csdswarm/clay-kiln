'use strict';

const URL = require('url-parse'),
  // https://regex101.com/r/gDfIxb/1
  spaLinkRegex = new RegExp(`^.*(?=${process.env.CLAY_SITE_HOST}).*$`);

/**
 * Add SPA navigation listener to links
 * @function
 * @param {object} anchorTagsContainer -- node that has anchor tag children
 */
function addEventListeners(anchorTagsContainer) {
  // Attach vue router listener on SPA links that are not opening in a new tab/window.
  const anchorTags = anchorTagsContainer.querySelectorAll('a.spa-link');

  if (anchorTags) {
    anchorTags.forEach(anchor => {
      if (String(anchor.getAttribute('target')).toLowerCase() !== '_blank') {
        anchor.addEventListener('click', event => {
          let link = anchor.getAttribute('href');

          if (!link.includes('http')) {
            link = window.location.protocol + link;
          }

          event.preventDefault();
          anchor.removeEventListener('click', anchor.fn, false);

          navigateTo(URL(link).pathname);
        });
      }
    });
  }
}

/**
 * Navigate to path in SPA
 * @function
 * @param {string} path
 */
function navigateTo(path) {
  // eslint-disable-next-line no-undef
  vueApp._router.push(path || '/');
}


/**
 * returns boolean of whether it is a link within the SPA
 * return true if link is on current URL host or
 * starts with '/' and is not '/audio'
 *
 * @param {string} uri
 * @returns {boolean}
 */
function isSpaLink(uri) {
  return spaLinkRegex.test(uri) || ( uri[0] === '/' && uri !== '/audio' );
}

/**
 * returns if a domain is part of the entercom approved list
 *
 * @param {string} hostname
 * @return {boolean}
 */
function isEntercomDomain(hostname) {
  const SEO_FOLLOW_DOMAINS = ['1thingus.com,entercom.com', 'culinarykitchenchicago.com', 'dfwrestaurantweek.com',
      'musictowndetroit.com', 'mensroomlive.com', 'jimrome.com', 'radio.com'],
    domain = hostname.split('.').reverse().slice(0, 2).reverse().join('.');

  return SEO_FOLLOW_DOMAINS.includes(domain);
}

/**
 * prepare a link object for the spa with adding necessary classes
 *
 * @param {object} link
 * @param {function} addClass
 * @param {function} setAttribute
 * @param {function} getAttribute
 */
function prepareLink(link, addClass, setAttribute, getAttribute) {
  const href = getAttribute(link, 'href'),
    target = getAttribute(link, 'target');

  if (isSpaLink(href) && !href.startsWith('#') && target !== '_blank') {
    addClass(link, 'spa-link');
  } else {
    const linkParts = new URL(href);

    if (!isEntercomDomain(linkParts.hostname)) {
      setAttribute(link, 'rel', 'nofollow');
    }

    addClass(link, 'outbound-link');
    setAttribute(link, 'target', '_blank');
  }
}

/**
 * prepare a dom object for the spa with adding necessary classes
 *
 * @param {object} doc
 */
function prepareDOM(doc) {
  const addClass = (link, className) => link.classList.add(className),
    setAttribute = (link, name, value) => link.setAttribute(name, value),
    getAttribute = (link, name) => link.getAttribute(name);

  doc.querySelectorAll('a[href]').forEach(link => prepareLink(link, addClass, setAttribute, getAttribute));
}

/**
 * prepare cheerio document for the spa with adding necessary classes
 *
 * @param {object} $
 */
function prepareCheerio($) {
  const addClass = (link, className) => link.addClass(className),
    setAttribute = (link, name, value) => link.attr(name, value),
    getAttribute = (link, name) => link.attr(name);

  $('a[href]').each(function () {
    prepareLink($(this), addClass, setAttribute, getAttribute);
  });
}

/**
 * prepare dom object or cheerio object for the spa with adding necessary classes
 *
 * @param {object} doc
 */
function prepare(doc) {
  doc.querySelectorAll ? prepareDOM(doc) : prepareCheerio(doc);
}

module.exports.addEventListeners = addEventListeners;
module.exports.navigateTo = navigateTo;
module.exports.prepare = prepare;
