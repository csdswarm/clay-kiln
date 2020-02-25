'use strict';

const { prettyJSON } = require('./base')

/**
 * If the error is from axios with a response then format it as a string.
 *   Otherwise return the error's message.  This is meant to make errors
 *   informative yet concise because the raw error from axios is enormous.
 */
function formatAxiosError_v1(err) {
  const { response: res } = err;

  let result = err.message;

  if (res) {
    result = 'status: ' + res.status
      + '\nheaders: ' + prettyJSON(res.headers)
      + '\ndata: ' + prettyJSON(res.data);
  }

  return result;
}

module.exports = {
  v1: formatAxiosError_v1,
};
