'use strict';

const { _, prettyJSON } = require('./base')

/**
 * If the error is from axios with a response then format it as a string.
 *   Otherwise return the error's message.  This is meant to make errors
 *   informative yet concise because the raw error from axios is enormous.
 *
 * @param {object} err
 * @param {object} opts
 * @param {bool} opts.includeStack - if it's an axios error, determines whether
 *   the stacktrace should be displayed.  Normally this isn't useful for axios
 *   errors since axios swallows the stack trace.
 * @param {bool} opts.shouldTruncate - whether the request and response bodies
 *   should be truncated in the error output.  Sometimes these are so big that
 *   they are unhelpful/clutter.
 */
function formatAxiosError_v1(err, opts = {}) {
  const { response: res } = err,
    { includeStack, shouldTruncate = true } = opts,
    isAxiosError = !!res;

  let result

  if (!isAxiosError) {
    result = err.stack;
  } else {
    const req = res.config;

    let resData = prettyJSON(res.data),
      reqData = prettyJSON(JSON.parse(req.data));

    if (shouldTruncate) {
      resData = _.truncate(resData, { length: 120 });
      reqData = _.truncate(reqData, { length: 120 });
    }

    result = includeStack
      ? err.stack
      : err.message;

    result += '\n\n'
      + 'response'
      + '\n--------'
      + '\nstatus: ' + res.status
      + '\nheaders: ' + prettyJSON(res.headers)
      + '\ndata: ' + resData
      + '\n\nrequest'
      + '\n-------'
      + '\nmethod: ' + req.method
      + '\nurl: ' + req.url
      + '\ndata: ' + reqData
      + '\nheaders: ' + prettyJSON(req.headers)
  }

  return result;
}

module.exports = {
  v1: formatAxiosError_v1,
};
