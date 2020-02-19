'use strict';

const _truncate = require('lodash/truncate'),
  { prettyJSON } = require('./utils');

/**
 * If the error is from axios with a response then format it as a string.
 *   Otherwise return the error's message.  This is meant to make errors
 *   informative yet concise because the raw error from axios is enormous.
 *
 * @param {Error} err
 * @returns {string}
 */
module.exports = err => {
  const { response: res, stack } = err;

  let result = stack;

  if (res) {
    const req = res.config;

    result = ''
      + 'response'
      + '\n--------'
      + '\nstatus: ' + res.status
      + '\nheaders: ' + prettyJSON(res.headers)
      + '\ndata: ' + _truncate(prettyJSON(res.data), { length: 120 })
      + '\n\nrequest'
      + '\n-------'
      + '\nmethod: ' + req.method
      + '\nurl: ' + req.url
      + '\ndata: ' + _truncate(req.data, { length: 120 })
      + '\nheaders: ' + prettyJSON(req.headers)
      + `\n\n${stack}`;
  }

  return result;
};
