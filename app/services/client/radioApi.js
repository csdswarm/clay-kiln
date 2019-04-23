'use strict';

const rest = require('../universal/rest'),
  { formatLocal } = require('../../services/universal/dateTime'),
  { getLocals } = require('./spaLocals'),
  spaLinkService = require('./spaLink'),
  clientPlayerInterface = require('../../services/client/ClientPlayerInterface')(),
  /**
   * returns boolean if it is a link inside the spa
   *
   * @param {string} uri
   * @returns {boolean}
   */
  isSpaLink = (uri) => /https?:\/\/.*.radio.com/.test(uri) || uri.charAt(0) === '/',
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
      const anchors = doc.querySelectorAll('a');

      anchors.forEach((anchor) =>  {
        const href = anchor.getAttribute('href');

        if (isSpaLink(href) && !anchor.classList.contains('spa-link')) {
          anchor.classList.add('spa-link');
        }
      });

      spaLinkService.apply(doc);

      return doc;
    },
    /**
     * Adds the click events for any play button
     *
     * @param {Node} doc
     * @returns {Node}
     */
    (doc) => {
      // Attach play button click handlers
      doc.querySelectorAll('[data-play-station]').forEach(element => {
        element.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const playbackStatus = element.classList.contains('show__play') ? 'play' : 'pause';

          clientPlayerInterface[playbackStatus](element.dataset.playStation);
        });
      });
      return doc;
    }
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
    const separator = route.includes('?') ? '&' : '?',
      options = {
        headers: new Headers({ 'x-locals': JSON.stringify(getLocals()) })
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
   * @returns {*}
   */
  get = (route) => {
    return rest.get(route).then(data => {
      return data;
    });
  };

module.exports.get = get;
module.exports.fetchDOM = fetchDOM;
