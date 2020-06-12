'use strict';

let access_token,
  expires_in = 0,
  accessTokenUpdated = null;

const log = require('./log').setup({ file: __filename }),
  rest = require('./rest'),
  brightcoveCmsApi = `cms.api.brightcove.com/v1/accounts/${ process.env.BRIGHTCOVE_ACCOUNT_ID }/`,
  brightcoveIngestApi = `ingest.api.brightcove.com/v1/accounts/${ process.env.BRIGHTCOVE_ACCOUNT_ID }/videos/`,
  brightcoveVideoViewsApi = `analytics.api.brightcove.com/v1/alltime/accounts/${ process.env.BRIGHTCOVE_ACCOUNT_ID }/videos/`,
  brightcoveOAuthApi = 'https://oauth.brightcove.com/v4/access_token?grant_type=client_credentials',
  qs = require('qs'),
  radioApi = require('../server/radioApi'),
  methods = [
    'GET',
    'POST',
    'PATCH',
    'PUT',
    'DELETE'
  ],
  /**
   * sets the brightcove url and params for the api
   *
   * @param {string} api
   * @param {object} params
   * @returns {string}
   */
  getBrightcoveUrl = (api) => {
    let url;

    switch (api) {
      case 'analytics':
        url = brightcoveVideoViewsApi;
        break;
      case 'ingest':
        url = brightcoveIngestApi;
        break;
      default:
        url = brightcoveCmsApi;
    }

    return `https://${url}`;
  },
  /**
   * Creates a url from a route and params
   *
   * @param {string} route
   * @param {object} params
   * @param {string} api
   * @returns {string}
   */
  createEndpoint = (route, params, api) => {
    const apiUrl = getBrightcoveUrl(api),
      decodeParams = params ? `?${ decodeURIComponent(qs.stringify(params)) }` : '';

    route = route || '';

    return `${ apiUrl }${ route }${ decodeParams }`;
  },
  /**
   * Retrieve access token and expiry time from oauth
   */
  getAccessToken = async () => {
    const currentTime = new Date().getTime() / 1000;

    if (!access_token || (accessTokenUpdated && currentTime >= accessTokenUpdated + expires_in)) {
      const base64EncodedCreds = Buffer.from(`${ process.env.BRIGHTCOVE_CLIENT_ID }:${ process.env.BRIGHTCOVE_CLIENT_SECRET }`).toString('base64'),
        { status, statusText, body: response } = await rest.request(brightcoveOAuthApi, {
          method: 'POST',
          credentials: 'include',
          headers: {
            Authorization: `Basic ${ base64EncodedCreds }`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

      if (status === 200 && response.access_token) {
        accessTokenUpdated = new Date().getTime() / 1000; // current time in seconds
        access_token = response.access_token;
        expires_in = response.expires_in;
      } else {
        const e = new Error(`${ status } Failed to request access token. Error: ${ statusText }`);

        log('error', e.message);
      }
    }
  },
  /**
   * Retrieve response from endpoint
   * (Uses Brightcove CMS api in endpoint)
   *
   * @param {string} method
   * @param {string} route
   * @param {object} params
   * @param {object} [data]
   * @returns {Promise}
   * @throws {Error}
   */
  request = async (method, route, params, data) => {
    try {
      const endpoint = createEndpoint(route, params);

      await getAccessToken();
      if (!access_token) {
        return { status: 401, statusText: 'Unauthorized' };
      }

      return await rest.request(endpoint, {
        method: method && methods.includes(method.toUpperCase()) ? method.toUpperCase() : 'GET',
        body: data ? JSON.stringify(data) : '',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${ access_token }`
        }
      });
    } catch (e) {
      log('error', e);
      return { status: 500, statusText: e };
    }
  },
  /**
   * uses the radioApi get/caching to
   *
   * @param {Object} options
   * @returns {Promise}
   */
  get = async (options) => {
    await getAccessToken();

    if (!access_token) {
      return { status: 401, statusText: 'Unauthorized' };
    }

    const { api, route, params, ttl } = options,
      url = getBrightcoveUrl(api, params),
      endpoint = route ? `${ url }${ route }` : url,
      headers = {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${ access_token }`
        }
      },
      radioApiOptions = {
        ttl,
        headers
      };

    try {
      const body = await radioApi.get(endpoint, params, null, radioApiOptions);

      return { status: 200, body };
    } catch (e) {
      return { status: 500, statusText: e };
    }
  },
  /**
   * Retrieve Brightcove S3 urls from Ingest API
   *
   * @param {string} videoID
   * @param {string} sourceName
   * @returns {Promise}
   * @throws {Error}
   */
  getS3Urls = async (videoID, sourceName) => {
    try {
      const endpoint = createEndpoint(`${ videoID }/upload-urls/${ sourceName }`, null, 'ingest');

      await getAccessToken();
      if (!access_token) {
        return { status: 401, statusText: 'Unauthorized' };
      }

      // eslint-disable-next-line one-var
      const { status, statusText, body: response } = await rest.request(endpoint, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${ access_token }`
          }
        }),
        { signed_url, api_request_url } = response;

      if (status !== 200 || !signed_url || !api_request_url) {
        log('error', `${ status } ${ statusText } ${ response }`);
      }

      return { status, statusText, signed_url, api_request_url };
    } catch (e) {
      log('error', e);
      return { status: 500, statusText: e };
    }
  },
  /**
   * Request to ingest the video file from its S3 location.
   *
   * @param {string} videoID
   * @param {string} videoUrlInS3
   * @returns {Promise}
   * @throws {Error}
   */
  ingestVideoFromS3 = async (videoID, videoUrlInS3) => {
    try {
      const endpoint = createEndpoint(`${ videoID }/ingest-requests`, null, 'ingest');

      await getAccessToken();
      if (!access_token) {
        return { status: 401, statusText: 'Unauthorized' };
      }

      return await rest.request(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          master: {
            url: videoUrlInS3
          },
          profile: 'multi-platform-standard-static-with-mp4-custom-thumbnail',
          'capture-images': true
        }),
        headers: {
          Authorization: `Bearer ${ access_token }`,
          'Content-Type': 'application/json'
        }
      });
    } catch (e) {
      log('error', e);
      return { status: 500, statusText: e };
    }
  },
  /**
   * Get status of ingest job
   *
   * @param {string} videoID
   * @param {string} jobID
   * @returns {Promise}
   * @throws {Error}
   */
  getStatusOfIngestJob = async (videoID, jobID) => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const endpoint = `videos/${ videoID }/ingest_jobs/${ jobID }`;

          resolve(await request('GET', endpoint));
        } catch (e) {
          log('error', e);
          resolve({ status: 500, statusText: e });
        }
      }, 1000);
    });
  };

module.exports.request = request;
module.exports.get = get;
module.exports.getS3Urls = getS3Urls;
module.exports.ingestVideoFromS3 = ingestVideoFromS3;
module.exports.getStatusOfIngestJob = getStatusOfIngestJob;
