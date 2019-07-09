'use strict';

let access_token,
  expires_in = 0,
  accessTokenUpdated = null;

const log = require('./log').setup({file: __filename}),
  rest = require('./rest'),
  brightcoveCmsApi = `cms.api.brightcove.com/v1/accounts/${process.env.BRIGHTCOVE_ACCOUNT_ID}/`,
  brightcoveIngestApi = `https://ingest.api.brightcove.com/v1/accounts/${process.env.BRIGHTCOVE_ACCOUNT_ID}/videos/`,
  brightcoveAnalyticsApi = 'analytics.api.brightcove.com/v1/data',
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
   * @return {string}
   */
  getBrightcoveUrl = (api, params) => {
    let url;

    // analytics data endpoint is odd... "accounts" is a param
    // https://analytics.api.brightcove.com/v1/data?accounts=account_id(s)&dimensions=video&where=video==video_id
    if (api == 'analytics') {
      url = brightcoveAnalyticsApi;
      if (params) {
        params.accounts = process.env.BRIGHTCOVE_ACCOUNT_ID;
      }
    } else {
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
   * @return {string}
   */
  createEndpoint = (route, params, api) => {
    const apiUrl = getBrightcoveUrl(api, params),
      decodeParams = params ? `?${decodeURIComponent(qs.stringify(params))}` : '';

    route = route || '';

    return `${apiUrl}${route}${decodeParams}`;
  },
  /**
   * Retrieve access token and expiry time from oauth
   *
   * @return {Promise}
   * @throws {Error}
   */
  getAccessToken = async () => {
    const currentTime = new Date().getTime() / 1000;

    if (!access_token || (accessTokenUpdated && currentTime >= accessTokenUpdated + expires_in)) {
      const base64EncodedCreds = Buffer.from(`${process.env.BRIGHTCOVE_CLIENT_ID}:${process.env.BRIGHTCOVE_CLIENT_SECRET}`).toString('base64'),
        response = await rest.request(brightcoveOAuthApi, {
          method: 'POST',
          credentials: 'include',
          headers: {
            Authorization: `Basic ${base64EncodedCreds}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

      if (response.access_token) {
        accessTokenUpdated = new Date().getTime() / 1000; // current time in seconds
        access_token = response.access_token;
        expires_in = response.expires_in;
      } else {
        const e = new Error(`Failed to request access token. Error: ${response.response.statusText}`);

        log('error', e.message);
        return null;
      }
    } else {
      return { access_token, expires_in };
    }
  },
  /**
   * Retrieve response from endpoint
   *
   * @param {string} method
   * @param {string} route
   * @param {object} params
   * @param {object} [data]
   * @return {Promise}
   * @throws {Error}
   */
  request = async (method, route, params, data) => {
    try {
      const endpoint = createEndpoint(route, params);

      await getAccessToken();
      if (!access_token) {
        return null;
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
      log('error', e.response.statusText);
      return null;
    }
  },
  /**
   * uses the radioApi get/caching to
   *
   * @param {Object} options
   * @return {Promise}
   */
  get = async (options) => {
    await getAccessToken();

    if (!access_token) {
      return null;
    }

    const { api, route, params, ttl } = options,
      url = getBrightcoveUrl(api, params),
      endpoint = route ? `${url}${route}` : url,
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

    return await radioApi.get(endpoint, params, null, radioApiOptions);
  },
  /**
   * Retrieve Brightcove S3 urls from Ingest API
   *
   * @param {string} videoID
   * @param {string} sourceName
   * @return {Promise}
   * @throws {Error}
   */
  getS3Urls = async (videoID, sourceName) => {
    try {
      const endpoint = `${brightcoveIngestApi}${videoID}/upload-urls/${sourceName}`,
        currentTime = new Date().getTime() / 1000;

      if (!access_token || (accessTokenUpdated && currentTime >= accessTokenUpdated + expires_in)) {
        ({ access_token, expires_in } = await getAccessToken());
      }

      await getAccessToken();
      if (!access_token) {
        return null;
      }

      // eslint-disable-next-line one-var
      const response = await rest.request(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${ access_token }`
        }
      });

      if (response.signed_url && response.api_request_url) {
        const {signed_url, api_request_url} = response;

        return {signed_url, api_request_url};
      } else {
        log('error', response);
        return null;
      }
    } catch (e) {
      log('error', e);
      return null;
    }
  },
  /**
   * Request to ingest the video file from its S3 location.
   *
   * @param {string} videoID
   * @param {string} videoUrlInS3
   * @return {Promise}
   * @throws {Error}
   */
  ingestVideoFromS3 = async (videoID, videoUrlInS3) => {
    try {
      const endpoint = `${brightcoveIngestApi}${videoID}/ingest-requests`,
        currentTime = new Date().getTime() / 1000;

      if (!access_token || (accessTokenUpdated && currentTime >= accessTokenUpdated + expires_in)) {
        ({ access_token, expires_in } = await getAccessToken());
      }

      if (!access_token) {
        return null;
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
      return null;
    }
  },
  /**
   * Get status of ingest job
   *
   * @param {string} videoID
   * @param {string} jobID
   * @return {Promise}
   * @throws {Error}
   */
  getStatusOfIngestJob = async (videoID, jobID) => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const endpoint = `videos/${videoID}/ingest_jobs/${jobID}`,
            response = await request('GET', endpoint);

          resolve(response.state || 'failed');
        } catch (e) {
          log('error', e);
          resolve(`return ingest status error: ${e}`);
        }
      }, 1000);
    });
  };

module.exports.request = request;
module.exports.get = get;
module.exports.getS3Urls = getS3Urls;
module.exports.ingestVideoFromS3 = ingestVideoFromS3;
module.exports.getStatusOfIngestJob = getStatusOfIngestJob;
