'use strict';

/**
 * Throws an error and attaches a status code to the error.
 * The `status` property is then used by Amphora to determine
 * the error code to send back.
 *
 * @param  {String} msg
 * @param  {Numeber} code
 */
function sendError(msg, code = 500) {
  var err = new Error(msg);

  err.status = code;
  throw err;
}

/**
 * In retrieving data from Elastic, a component might want to 404
 * the page, but that `throw` would be caught in the `catch` func
 * for the model.js. And Elastic could also error. This helper
 * just allows you to 404 a page but also not miss out on errors
 * from Elastic itself
 *
 * @param  {Error} e
 */
function elasticCatch(e) {
  // If we have statusCode, it's an error from Elastic
  if (e.statusCode) {
    throw new Error(`Bad Elastic request: ${e.message}`);
  }

  // Else it's one from the render function
  throw e;
}

module.exports.sendError = sendError;
module.exports.elasticCatch = elasticCatch;
