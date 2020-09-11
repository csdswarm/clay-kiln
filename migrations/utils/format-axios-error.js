'use strict';

const { _, prettyJSON } = require('./base')

/**
 * If the error is from axios with a response then format it as a string.
 *   Otherwise return the error's message.  This is meant to make errors
 *   informative yet concise because the raw error from axios is enormous.
 */
function formatAxiosError_v1(err, { includeStack } = {}) {
  const { response: res } = err;

  let result = includeStack
    ? err.stack
    : err.message;

  if (res) {
    const req = res.config;

    result = ''
      + 'response'
      + '\n--------'
      + '\nstatus: ' + res.status
      + '\nheaders: ' + prettyJSON(res.headers)
      + '\ndata: ' + _.truncate(prettyJSON(res.data), { length: 120 })
      + '\n\nrequest'
      + '\n-------'
      + '\nmethod: ' + req.method
      + '\nurl: ' + req.url
      + '\ndata: ' + _.truncate(req.data, { length: 120 })
      + '\nheaders: ' + prettyJSON(req.headers)

    if (includeStack) {
      result += '\n' + err.stack;
    }
  }

  return result;
}

module.exports = {
  v1: formatAxiosError_v1,
};
