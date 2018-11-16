'use strict';

const amphora = require('amphora'),
  log = require('../universal/log').setup({file: __filename}),
  utils = require('../universal/utils'),
  redisEndpoint = process.env.REDIS_HOST,
  db = amphora.db;

var levelup, redisdown;

/**
 * Any initialization of the DB should occur here.
 */
function setup() {
  if (redisEndpoint) {
    levelup = require('levelup');
    redisdown = require('redisdown');
    db.setDB(levelup(process.env.REDIS_DB || 'mydb', { db: redisdown, url: redisEndpoint }));
    log('info', `Using Redis at ${redisEndpoint}`);
  }
}

function logBatchOperations(ops) {
  log('info', 'batch:\n' + db.formatBatchOperations(ops));
}

/**
 * Replace or create a new value in the db.
 *
 * @param {string} ref
 * @param {function} fn
 * @returns {Promise}
 */
function update(ref, fn) {
  return db.get(ref)
    .then(JSON.parse)
    .catch(function () {
      // doesn't exist yet
      return null;
    })
    .then(function (value) {
      return fn(value);
    }).then(function (result) {
      if (result) {
        // must be object or array
        if (!(typeof result === 'object')) {
          throw new Error('Must be object');
        }

        return {
          type: 'put',
          key: ref,
          value: JSON.stringify(result)
        };
      }
    });
}

/**
 * Determine if url or uri is a certain version
 *
 * @param {string} ref
 * @param {string} version
 * @returns {boolean}
 */
function isVersion(ref, version) {
  var split = ref.split('@'),
    refVersion = split && split[1]; // specifically, the second part

  return refVersion === version;
}

/**
 * Get
 * @param  {String} ref
 * @return {Promise}
 */
function get(ref) {
  return db.get(ref)
    .then(JSON.parse);
}

module.exports.setup = setup;
module.exports.getUri = uri => db.get(uri);
module.exports.get = get;
module.exports.put = db.put;
module.exports.list = db.list;
module.exports.batch = db.batch;
module.exports.update = update;
module.exports.logBatchOperations = logBatchOperations;
module.exports.isVersion = isVersion;
module.exports.uriToUrl = utils.uriToUrl;
