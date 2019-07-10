'use strict';

const rest = require('../universal/rest'),
  { formatLocal } = require('../../services/universal/dateTime'),
  { getLocals } = require('./spaLocals'),
  spaLinkService = require('./spaLink'),
  clientPlayerInterface = require('../../services/client/ClientPlayerInterface')(),
  // https://regex101.com/r/gDfIxb/1
  spaLinkRegex = new RegExp(`^.*(?=${window.location.host}).*$`),
  /**
   * returns if a domain is part of the entercom approved list
   * ** NOTE: This is duplicated in the spa also merged into the release-radium branch where it can be shared
   * @param {string} hostname
   * @return {boolean}
   */
  isEntercomDomain = (hostname) => {
    const SEO_FOLLOW_DOMAINS = ['1thingus.com,entercom.com','culinarykitchenchicago.com','dfwrestaurantweek.com',
        'musictowndetroit.com','mensroomlive.com','jimrome.com','radio.com'],
      domain = hostname.split('.').reverse().slice(0,2).reverse().join('.');

    return SEO_FOLLOW_DOMAINS.includes(domain);
  },
  /**
   * returns boolean of whether it is a link within the SPA
   * return true if link is on current URL host or
   * starts with '/' and is not '/audio'
   *
   * @param {string} uri
   * @returns {boolean}
   */
  isSpaLink = (uri) => spaLinkRegex.test(uri) || ( uri[0] === '/' && uri !== '/audio' ),
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
        } else if (!isEntercomDomain(href)) {
          anchor.setAttribute('rel', 'nofollow');
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
