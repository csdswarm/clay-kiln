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
  const anchorTags = anchorTagsContainer.querySelectorAll('a.spa-link:not([target="_blank" i])');

  if (anchorTags) {
    anchorTags.forEach(anchor => {
      anchor.addEventListener('click', event => {
        let link = anchor.getAttribute('href');

        if (!link.includes('http')) {
          link = window.location.protocol + link;
        }

        event.preventDefault();
        anchor.removeEventListener('click', anchor.fn, false);

        navigateTo(URL(link).pathname);
      });
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
 * prepare a document for the spa with adding necessary classes
 *
 * @param {object} doc
 */
function prepare(doc) {
  doc.querySelectorAll('a[href]').forEach(
    link => {
      if (isSpaLink(link.href) && !link.href.startsWith('#') && link.target !== '_blank') {
        link.classList.add('spa-link');
      } else {
        const linkParts = new URL(link.href);

        if (!isEntercomDomain(linkParts.hostname)) {
          link.setAttribute('rel', 'nofollow');
        }

        link.classList.add('outbound-link');
        link.setAttribute('target', '_blank');
      }
    }
  );
}

module.exports.addEventListeners = addEventListeners;
module.exports.navigateTo = navigateTo;
module.exports.prepare = prepare;
