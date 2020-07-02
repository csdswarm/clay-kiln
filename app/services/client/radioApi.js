'use strict';

const rest = require('../universal/rest'),
  qs = require('qs'),
  md5 = require('md5'),
  _uniq = require('lodash'),
  { formatLocal } = require('../../services/universal/dateTime'),
  { getLoadedIds, getLocals } = require('./spaLocals'),
  spaLinkService = require('../universal/spaLink'),
  clientPlayerInterface = require('./ClientPlayerInterface')(),
  clientUserInterface = require('./ClientUserInterface')(),
  clientStateInterface = require('./ClientStateInterface')(),
  radioApi = 'api.radio.com/v1/',
  radioStgApi = 'api-stg.radio.com/v1/',
  // here for models that reference /server/radioApi (brightcove)
  TTL = {
    NONE: 0,
    DEFAULT: 300000,
    MIN: 60000,
    HOUR: 3600000,
    DAY: 86400000
  },
  httpRegEx = /^https?:\/\//,
  /**
   * Returns if the route passed in is for api.radio.com or a different location
   *
   * @param {string} route
   * @return {boolean}
   */
  isRadioApiRoute = (route) => !httpRegEx.test(route),
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
  __ = {
    clientStateInterface,
    spaInterface
  },
  /**
   * Client side AJAX call to get the specified route and returns a DOM object
   *
   * @param {string} route
   * @param {object} opts
   * @param {object} opts.shouldDedupeContent - handles the x-loaded-ids request and response header.
   *   See 'loaded-ids.js' under startup/add-to-locals/ and add-interceptor/ for more details.
   * @param {object} opts.bypassCache - adds random query parameter to bypass caching
   *
   * @returns {Promise} which returns {Node}
   */
  fetchDOM = async (route, { shouldDedupeContent = false, bypassCache = false } = {}) => {
    const state = (await __.clientStateInterface.getState())[0],
      separator = route.includes('?') ? '&' : '?',
      requestHeaders = { 'x-locals': JSON.stringify(getLocals(state)) };

    let loadedIdsHash = '';

    if (shouldDedupeContent) {
      // these are false positives because there is no chain
      // eslint-disable-next-line lodash/prefer-thru,lodash/unwrap
      const loadedIdsReqHeader = JSON.stringify(_uniq(getLoadedIds(state)).sort());

      requestHeaders['x-loaded-ids'] = loadedIdsReqHeader;
      // we need this hash to make sure the request is cached appropriately.
      // if you know of a better way to accomplish this let me know :)
      loadedIdsHash = `&loadedIdsHash=${md5(loadedIdsReqHeader)}`;
    }

    const options = { headers: new Headers(requestHeaders) },
      bypass = bypassCache ? `&random=${Date.now()}` : '',
      url = `${route}${separator}ignore_resolve_media=true${loadedIdsHash}${bypass}`,
      response = await fetch(url, options),
      loadedIdsStr = response.headers.get('x-loaded-ids');

    if (shouldDedupeContent && loadedIdsStr) {
      __.clientStateInterface.setLoadedIds(JSON.parse(loadedIdsStr));
    }

    const html = await response.text(),
      doc = new DOMParser().parseFromString(html, 'text/html'),
      elements = doc.body.childElementCount === 1 ? doc.body.children[0] : Array.from(doc.body.children),
      frag = document.createDocumentFragment();

    if (Array.isArray(elements)) {
      elements.forEach((element) => frag.append(element));
      return __.spaInterface(frag);
    }

    return __.spaInterface(elements);
  },
  /**
   * Creates a url from a route and params
   *
   * @param {string} route
   * @param {object} params
   * @param {object} locals
   * @return {string}
   */
  createEndpoint = (route, params, locals) => {
    const decodeParams = params ? `?${decodeURIComponent(qs.stringify(params))}` : '',
      apiHost = shouldUseStagingApi(locals) ? radioStgApi : radioApi;

    return isRadioApiRoute(route) ?
      `https://${apiHost}${route}${decodeParams}` :
      `${route}${decodeParams}`;
  },
  /**
   * Determines whether we should use the staging api
   *
   * @param {object} locals
   * @returns {boolean}
   */
  shouldUseStagingApi = (locals) => {
    return locals.useStagingApi && !locals.edit;
  },
  /**
   * Get data
   *
   * @param {string} route
   * @param {*} [params]
   * @param {function} [validate]
   * @param {object} [options]
   * @param {object} [locals]
   * @return {Promise}
   */
  // eslint-disable-next-line max-params
  get = (route, params, validate, options, locals = {}) => {
    const endpoint = createEndpoint(route, params, locals);

    return rest.get(endpoint).then(data => {
      return data;
    });
  };

module.exports.get = get;
module.exports.fetchDOM = fetchDOM;
module.exports.TTL = TTL;
module.exports._internals = __;
