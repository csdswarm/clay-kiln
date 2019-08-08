'use strict';

const rest = require('../universal/rest'),
  qs = require('qs'),
  { formatLocal } = require('../../services/universal/dateTime'),
  { getLocals } = require('./spaLocals'),
  spaLinkService = require('../universal/spaLink'),
  clientPlayerInterface = require('./ClientPlayerInterface')(),
  clientUserInterface = require('./ClientUserInterface')(),
  clientStateInterface = require('./ClientStateInterface')(),
  // here for models that reference /server/radioApi (brightcove)
  TTL = {
    NONE: 0,
    DEFAULT: 300000,
    MIN: 60000,
    HOUR: 3600000,
    DAY: 86400000
  },
  // An array of functions that take in a node and return the mutated node with attached events or modifications to data
  spaFunctions = [
    /**
     * Adjusts the document with any user specific local information required
     *
     * @param {Node} doc
     * @returns {Node}
     */
    (doc) => {
      const userTimes = doc.querySelectorAll('userLocal') || [];

      userTimes.forEach((time) =>
        time.replaceWith(document.createTextNode(formatLocal(time.getAttribute('data-date'), time.getAttribute('data-format')))));

      return doc;
    },
    /**
     * Adds the click events for any links
     *
     * @param {Node} doc
     * @returns {Node}
     */
    (doc) => {
      spaLinkService.addEventListeners(doc);

      return doc;
    },
    /**
     * Adds the click events for any play button
     *
     * @param {Node} doc
     * @returns {Node}
     */
    (doc) => clientPlayerInterface.addEventListener(doc),
    /**
     * Adds the click events for users
     *
     * @param {Node} doc
     * @returns {Node}
     */
    (doc) => clientUserInterface.addEventListener(doc)
  ],
  /**
   * Attaches all spa interfaces
   *
   * @param {Node} doc
   * @returns {Node}
   */
  spaInterface = (doc) => {
    return spaFunctions.reduce((node, func) => func(node), doc);
  },
  /**
   * Client side AJAX call to get the specified route and returns a DOM object
   *
   * @param {string} route
   * @returns {Promise} which returns {Node}
   */
  fetchDOM = async (route) => {
    const state = await clientStateInterface.getState(),
      separator = route.includes('?') ? '&' : '?',
      options = {
        headers: new Headers({ 'x-locals': JSON.stringify(getLocals(state)) })
      },
      response = await fetch(`${route}${separator}ignore_resolve_media=true`, options),
      html = await response.text(),
      doc = new DOMParser().parseFromString(html, 'text/html'),
      elements = doc.body.childElementCount === 1 ? doc.body.children[0] : Array.from(doc.body.children),
      frag = document.createDocumentFragment();

    if (Array.isArray(elements)) {
      elements.forEach((element) => frag.append(element));
      return spaInterface(frag);
    }

    return spaInterface(elements);
  },
  /**
   * Get data
   *
   * @param {string} route
   * @param {*} [params]
   * @returns {*}
   */
  get = (route, params) => {
    const endpoint = params ? `${route}?${qs.stringify(params)}` : route;

    return rest.get(endpoint).then(data => {
      return data;
    });
  };

module.exports.get = get;
module.exports.fetchDOM = fetchDOM;
module.exports.TTL = TTL;
