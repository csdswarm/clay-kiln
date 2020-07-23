'use strict';

const ensureStartsWith = require('../ensure-starts-with').v1,
  httpGet = require('../http-get').v1,
  httpRequest = require('../http-request').v1,
  { axios } = require('../base');

/**
 * Returns a readable helper to avoid constructing the requests manually
 *   each time.
 *
 * helper schema: {
 *   get: {
 *     asText: restOfUrl => string
 *     asJson: restOfUrl => object
 *   },
 *   post: postOrPutArg => object|string
 *   put: postOrPutArg => object|string
 * }
 *
 * where the 'postOrPutArg' schema is: {
 *   responseType: 'json'|'text' (default is 'json')
 *   restOfUrl: {string}
 *   body: *
 *   headers: {object} (default is {})
 * }
 *
 * note: in postOrPutArg, 'headers' by default has
 *   'Content-Type: application/json' but you can override this.
 *
 * @param {object} parsedHost
 * @returns {object}
 * @example
 *
 * const httpEs = makeHttpEs(parsedHost);
 * // gets the aliases assigned to the index
 * let repsonseObj = await httpEs.get.asJson(`/published-content_v8/_alias`)
 *
 * // sets the index 'published-content_v9' with our settings and mappings
 * responseObj = httpEs.put({
 *   restOfUrl: '/published-content_v9',
 *   body: { settings, mappings }
 * })
 */
const makeHttpEs_v1 = parsedHost => {
  const { es, es: { http: protocol } } = parsedHost,
    validResponseTypes = new Set(['json', 'text']),
    validResponseTypesStr = Array.from(validResponseTypes).join(', '),
    esUrl = `${protocol}://${es.hostname}:${es.port}`,
    get = restOfUrl => {
      restOfUrl = ensureStartsWith('/')(restOfUrl);

      return httpGet({ url: esUrl + restOfUrl, http: protocol });
    },
    makePostOrPut = method => {
      return async argObj => {
        const {
            responseType = 'json',
            body,
            headers
          } = argObj,
          restOfUrl = ensureStartsWith('/')(argObj.restOfUrl);

        if (!validResponseTypes.has(responseType)) {
          throw new Error(
            `responseType must be one of: ${validResponseTypesStr}`
            + `\nthe default is json`
            + '\nresponseType given: ' + responseType
          );
        }

        const resp = await httpRequest({
          method,
          body,
          http: protocol,
          url: esUrl + restOfUrl,
          headers: Object.assign(
            {},
            { 'Content-Type': 'application/json' },
            headers
          )
        });

        return responseType === 'json'
          ? JSON.parse(resp.data)
          : resp.data;
      };
    };

  return {
    get: {
      asText: get,
      asJson: (...args) => get(...args).then(JSON.parse)
    },
    // I couldn't think of readable properties for post/put so I stuck
    //   'responseType' as an argument.  It's possible we'll want to post
    //   different body types without adding a header every time but currently
    //   we don't have a need for that. - PO
    post: makePostOrPut('POST'),
    put: makePostOrPut('PUT')
  };
};

/**
 * This function is expected to work in the same way the previous version does, but now
 * is using axios for handling the different requests made to elasticsearch endpoints.
 *
 * @param {object} parsedHost - should be passed only the es server info so that hostname,
 * http and port could be extracted from there
 * @returns {object}
 */
const makeHttpEs_v2 = ({ hostname, http, port }) => {
  if (!hostname || !http) {
    throw new Error(
      'make sure to pass hostname and http as params'
    );
  }

  const validResponseTypes = new Set(['json', 'text']),
    validResponseTypesStr = Array.from(validResponseTypes).join(', '),
    makeRequest = (method, preferredResponseType = '') => {
      return async(args) => {
        args = typeof args === 'string'
          ? { restOfUrl: args }
          : args;

        const { body, headers } = args,
          responseType = preferredResponseType || args.responseType || 'json',
          restOfUrl = ensureStartsWith('/')(args.restOfUrl);

        if (!validResponseTypes.has(responseType)) {
          throw new Error(
            `responseType must be one of: ${validResponseTypesStr}`
            + `\nthe default is json`
            + '\nresponseType given: ' + responseType
          );
        }

        const { data } = await axios({
          url: `${http}://${hostname}:${port}${restOfUrl}`,
          method,
          responseType,
          headers,
          data: body
        });

        return data;
      };
    };

  return {
    get: {
      asText: makeRequest('GET', 'text'),
      asJson: makeRequest('GET')
    },
    post: makeRequest('POST'),
    put: makeRequest('PUT')
  };
};

module.exports = {
  v1: makeHttpEs_v1,
  v2: makeHttpEs_v2
};
