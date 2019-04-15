'use strict';

const externalLinkReg = /player.radio.com|\/audio/;

/**
 * Determine whether links are external -- recursive for lists within lists
 * @function setExternalLinks
 * @param {Object[]} linkList - Array of objects containing link data
 * @return {Object[]}
 */
function setExternalLinks(linkList) {
  return linkList.map((link) => {
    if (link.url) {
      link.externalLink = externalLinkReg.test(link.url);
    }

    if (link.list) {
      link.list = setExternalLinks(link.list);
    }

    return link;
  });
}

module.exports.render = (ref, data, locals) => {
  setExternalLinks(data.headerLinks);
  data.headerLinks = data.headerLinks.map((headerLink) => {
    headerLink.current = locals.url.includes(headerLink.url);
    return headerLink;
  });
  return data;
};
