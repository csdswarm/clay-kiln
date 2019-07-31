'use strict';

const log = require('../universal/log').setup({ file: __filename }),
  db = require('../server/db');

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
      locals = header ? JSON.parse(header) : null;

    res.locals = res.locals ? {
      ...res.locals,
      ...locals
    } : locals;
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
  spaLocals(req, res);
  await entercomDomains(req, res);

  next();
};

