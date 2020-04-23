'use strict';

const log = require('../universal/log').setup({ file: __filename }),
  deepmerge = require('deepmerge'),
  db = require('../server/db'),
  logger = require('../universal/logger');

let ENTERCOM_DOMAINS = null;

/**
 * grabs locals from the header and adds to the req.locals
 *
 * @param {object} req
 * @param {object} res
 */
function spaLocals(req, res) {
  try {
    const header = req.header('x-locals'),
      locals = header ? JSON.parse(header) : null,
      options = { arrayMerge: (destinationArray, sourceArray) => sourceArray };

    if (locals) {
      res.locals = deepmerge(res.locals, locals, options);
    }
  } catch (e) {
    log('error', 'Error in locals middleware:', e);
  }
}

/**
 * adds the list of entercom domains to req.locals
 *
 * @param {object} req
 * @param {object} res
 */
async function entercomDomains(req, res) {
  try {
    if (!ENTERCOM_DOMAINS) {
      ENTERCOM_DOMAINS = await db.get(`${process.env.CLAY_SITE_HOST}/_lists/entercom-domains`).catch(() => []);
    }
    res.locals.ENTERCOM_DOMAINS = ENTERCOM_DOMAINS;
  } catch (e) {
    log('error', 'Error in locals middleware:', e);
  }
}

/**
 * grabs locals from the header and adds to the req.locals
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
module.exports = async (req, res, next) => {
  logger(module, req, 'startAt');
  spaLocals(req, res);
  await entercomDomains(req, res);
  logger(module, req, 'endAt');
  next();
};

