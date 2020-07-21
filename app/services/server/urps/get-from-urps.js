'use strict';

const _truncate = require('lodash/truncate'),
  axios = require('axios'),
  jwtDecode = require('jwt-decode'),
  { prettyJSON } = require('../../universal/utils');

// the urps team doesn't have their auth layer working yet so we need to
//   additionally pass the cognito_id in the request body until that's turned on
const urpsHasAuthLayer = process.env.URPS_HAS_AUTH_LAYER === 'true';

/**
 * makes a POST request to urps for the desired info
 *
 * @param {string} path - url path
 * @param {object} reqBody - the request body
 * @param {string} jwt
 * @returns {object} - the axios response object
 */
module.exports = async (path, reqBody, jwt) => {
  const url = `${process.env.URPS_AUTHORIZATIONS_URL}${path}`;

  if (!urpsHasAuthLayer) {
    reqBody = Object.assign({}, reqBody, { cognito_id: jwtDecode(jwt).sub });
  }

  return axios.post(url, reqBody, { headers: { Authorization: jwt } })
    .catch(err => {
      const { response } = err;
      let errMsg = 'Error in urps request'
        + '\n-------------------'
        + `\nmessage: ${err.message}`
        + `\nurl: ${url}`
        + `\nreqBody: ${prettyJSON(reqBody)}`
        + `\njwt: ${jwt}`;

      if (response) {
        errMsg += `\nresponse status: ${response.status}`
          + `\nresponse body: ${_truncate(prettyJSON(response.data), { length: 120 })}`;
      }

      errMsg += '\n-------------------';

      return Promise.reject(new Error(errMsg));
    });
};
