'use strict';

/**
 * README
 *  - If you need to use this function to re-publish _a lot_ of uris then this
 *    function needs some work.  At that point we'd ideally depend on 'async' in
 *    order to loop through 5 or so at a time.  We'd also need to check for
 *    timeouts and retry accordingly because those tend to appear when hitting
 *    the servers that much.
 */

const formatAxiosError = require('../../utils/format-axios-error').v1,
  { axios, clayutils, ensureEndsWith, waitMs } = require('../../utils/base'),
  usingDb = require('../../utils/using-db').v1,
  { isPage, isPageMeta } = clayutils;

/**
 * goes through each uri and attempts to republish, keeping track of the uris
 *   which re-publish successfully and those which result in errors.
 *
 * this pulls from the database instead of publishing the latest content because
 *   the latest content may contain changes from editors which they didn't
 *   intend on being published yet.
 *
 * returns an object with the following schema
 * {
 *   success: <string[]> - all successfully re-published uris
 *   fail: [
 *     {
 *       uri: <string>
 *       err: <string> - a hopefully helpful error message
 *     }
 *     ...
 *   ]
 * }
 *
 * @param {string[]} pageUris - the uris to be republished
 * @param {object} envInfo - the result of parseHost
 * @param {object} opts
 * @param {boolean} [opts.enableLog = true] - whether this function should log its progress and the results.
 * @returns {object}
 */
async function republishPageUris_v1(
  pageUris,
  envInfo,
  { enableLog = true } = {}
) {
  const success = [],
    fail = [],
    log = makeLog(enableLog),
    nonPageUris = pageUris.filter(uri => !isPage(uri) && isPageMeta(uri));

  if (nonPageUris.length) {
    throw new Error(
      "pageUris contained uris which aren't pages"
      + '\n' + nonPageUris.join('\n')
    );
  }

  pageUris = pageUris.map(ensureEndsWith('@published'));

  log.info('attempting to republish...');

  await usingDb(async db => {
    for (const uri of pageUris) {
      try {
        log.info(uri);

        const dbResult = await db.query(
            `select data from pages where id = $1`,
            [uri]
          ),
          publishedData = dbResult.rows[0].data

        await axios.put(
          `${envInfo.http}://${uri}`,
          publishedData,
          { headers: { Authorization: 'token accesskey' } }
        );

        success.push(uri);
      } catch (err) {
        fail.push({
          uri,
          err: formatAxiosError(err)
        });
      } finally {
        // give the server a breather
        await waitMs(300)
      }
    }
  });

  log.info('\nfinished');

  // if all content succeeded then there's no need to list the successful
  //   content uris
  if (!fail.length) {
    log.info('\nall content successfully re-published');
  } else {
    if (success.length) {
      log.info(
        '\ncontent successfully re-published'
        + '\n---------------------------------'
        + '\n' + success.join('\n')
      );
    }

    log.error(
      '\n\ncontent errored when attempting to re-publish'
      + '\n---------------------------------------------'
      + '\n' + fail.map(formatFail).join('\n\n')
    );
  }

  return {
    success,
    fail
  }
}

module.exports = {
  v1: republishPageUris_v1,
}

// helper functions

function makeLog(enableLog) {
  const noop = () => {};

  if (!enableLog) {
    return {
      info: noop,
      error: noop
    };
  }

  return {
    info: (...args) => console.log(...args),
    error: (...args) => console.error(...args)
  };
}

function formatFail({ uri, err }) {
  return 'uri: ' + uri
    + '\nerror: ' + err;
}
