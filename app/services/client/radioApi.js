'use strict';

const rest = require('../universal/rest'),
  { formatLocal } = require('../../services/universal/dateTime'),
  spaLinkService = require('./spaLink'),
  /**
   * Adjusts the document with any user specific local information required
   *
   * @param {Node} doc
   * @returns {Node}
   */
  userLocal = (doc) => {
    const userTimes = doc.querySelectorAll('userLocal') || [];

    if (userTimes) {
      userTimes.forEach((time) =>
        time.replaceWith(document.createTextNode(formatLocal(time.getAttribute('data-date'), time.getAttribute('data-format')))));
    }

    return doc;
  },
  /**
   * returns boolean if it is a link inside the spa
   *
   * @param {string} uri
   * @returns {boolean}
   */
  isSpaLink = (uri) => /https?:\/\/.*.radio.com/.test(uri) || uri.charAt(0) === '/',
  /**
   * Adds the click events for any links
   *
   * @param {Node} doc
   * @returns {Node}
   */
  addSpaLinks = (doc) => {
    const anchors = doc.querySelectorAll('a');

    if (anchors) {
      anchors.forEach((anchor) =>  {
        const href = anchor.getAttribute('href');

        if (isSpaLink(href) && !anchor.classList.contains('spa-link')) {
          anchor.classList.add('spa-link');
        }
      });
    }

    spaLinkService.apply(doc);

    return doc;
  },
  /**
   * Client side AJAX call to get the specified route and returns a DOM object
   *
   * @param {string} route
   * @returns {Promise} which returns {Node}
   */
  fetchDOM = async (route) => {
    const separator = route.includes('?') ? '&' : '?',
      response = await fetch(`${route}${separator}ignore_resolve_media=true`),
      html = await response.text(),
      doc = new DOMParser().parseFromString(html, 'text/html'),
      elements = doc.body.childElementCount === 1 ? doc.body.children[0] : Array.from(doc.body.children),
      frag = document.createDocumentFragment();

    if (Array.isArray(elements)) {
      elements.forEach((element) => frag.append(element));
      return addSpaLinks(userLocal(frag));
    }

    return addSpaLinks(userLocal(elements));
  },
  /**
   * Get data
   *
   * @param {string} route
   * @returns {*}
   */
  get = (route) => {
    return rest.get(route).then(data => {
      return data;
    });
  };

module.exports.get = get;
module.exports.fetchDOM = fetchDOM;
