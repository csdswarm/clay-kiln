'use strict';

const _truncate = require('lodash/truncate'),
  axios = require('axios'),
  jwtDecode = require('jwt-decode'),
  { prettyJSON } = require('../../universal/utils');

// urps does not have their auth layer working locally which means we need to
//   send the cognito_id inside the request body instead of passing the jwt
//   inside the Authorization header
const urpsHasAuthLayer = process.env.URPS_AUTHORIZATIONS_URL
  ? !process.env.URPS_AUTHORIZATIONS_URL.includes('host.docker.internal')
  // default case intended for unit tests which shouldn't rely on
  //   environment variables
  : true;

/**
 * makes a POST request to urps for the desired info
 *
 * @param {string} path - url path
 * @param {object} reqBody - the request body
 * @param {string} jwt
 * @returns {object} - the axios response object
 */
module.exports = async (path, reqBody, jwt) => {
  const options = urpsHasAuthLayer
      ? { headers: { Authorization: jwt } }
      : {},
    url = `${process.env.URPS_AUTHORIZATIONS_URL}${path}`;

  if (!urpsHasAuthLayer) {
    reqBody = Object.assign({}, reqBody, { cognito_id: jwtDecode(jwt).sub });
  }

  return axios.post(url, reqBody, options)
    .catch(err => {
      const { response } = err;
      let errMsg = 'Error in urps request'
        + '\n-------------------'
        + `\nurl: ${url}`
        + `\nreqBody: ${prettyJSON(reqBody)}`
        + `\njwt: ${jwt}`;

      if (response) {
        errMsg += `\nresponse status: ${response.status}`
          + `\nresponse body: ${_truncate(response.data, { length: 120 })}`;
      }

      errMsg += '\n-------------------';

      return Promise.reject(new Error(errMsg));
    });
};
