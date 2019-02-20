'use strict';

const rest = require('../universal/rest'),
  { formatLocal } = require('../../services/universal/dateTime'),
  /**
   * Adjusts the document with any user specific local information required
   *
   * @param {Document} doc
   * @returns {Document}
   */
  userLocal = (doc) => {
    const userTimes = doc.querySelectorAll('userLocal') || [];

    userTimes.forEach((time) =>
      time.replaceWith(document.createTextNode(formatLocal(time.getAttribute('data-date'), time.getAttribute('data-format')))));

    return doc;
  },
  /**
   * Client side AJAX call to get the specified route and returns a DOM object
   *
   * @param {string} route
   * @returns {Promise} which returns {Document}
   */
  fetchDOM = async (route) => {
    const separator = route.includes('?') ? '&' : '?',
      response = await fetch(`${route}${separator}ignore_resolve_media=true`),
      html = await response.text(),
      doc = new DOMParser().parseFromString(html, 'text/html');

    return userLocal(doc);
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
