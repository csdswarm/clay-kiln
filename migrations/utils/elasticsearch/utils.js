'use strict';

/**
 * keep in mind any changes to these utilities should be accompanied by
 *   version bumpts
 */

const { _identity: isTruthy, prettyJSON } = require('../base');

/**
 * Ensures the currentIndex follows the naming convention '{alias}_v#'
 *
 * @param {string} index
 * @param {RegExp} indexConventionRe
 */
const assertIndexConvention = (index, indexConventionRe) => {
  if (!indexConventionRe.test(index)) {
    throw new Error(
      `index must match the regex ${indexConventionRe.toString()}`
      + `\nindex: ${index}`
    );
  }
};

/**
 * A function meant for Array.prototype.sort which sorts in descending order
 *
 * @param {number} left
 * @param {number} right
 * @returns {number}
 */
const descending = (left, right) => right - left;

/**
 * Returns the mappings for the current index
 *
 * @param {object} httpEs
 * @param {string} currentIndex
 */
const getMappings = async (httpEs, currentIndex) => {
  console.log(`getting elasticsearch mappings for '${currentIndex}'`);

  const resp = await httpEs.get.asJson(`/${currentIndex}/_mappings`);

  return resp[currentIndex].mappings;
};

/**
 * @param {object} httpEs
 * @param {string} alias
 * @param {RegExp} indexConventionRe
 */
const getRecentAndNewIndexes = async (httpEs, alias, indexConventionRe) => {
  // the 'h' param is documented here:
  // https://www.elastic.co/guide/en/elasticsearch/reference/6.2/cat.html#headers
  const resp = await httpEs.get.asText(`/_cat/indices/${alias}*?h=index`),
    latestVersion = resp.split('\n')
      .filter(isTruthy)
      .map(index => getVersion(index, indexConventionRe))
      .sort(descending)[0];

  return {
    previousIndex: `${alias}_v${latestVersion - 1}`,
    latestIndex: `${alias}_v${latestVersion}`,
    newIndex: `${alias}_v${latestVersion + 1}`
  };
};

/**
 * Returns the settings we care to pass on.
 *
 * Note: We're not sure why only analysis is being passed on, it's just how this
 *   code has always been.  If you know why please replace this comment with
 *   the explanation :)
 *
 * @param {object} httpEs
 * @param {string} currentIndex
 */
const getSettings = async (httpEs, currentIndex) => {
  const curSettings = await httpEs.get.asJson(`/${currentIndex}/_settings`);

  return {
    analysis: curSettings[currentIndex].settings.index.analysis
  };
};

/**
 * Gets the version from the currentIndex
 *
 * @param {string} index
 * @param {RegExp} indexConventionRe
 * @returns {number}
 */
const getVersion = (index, indexConventionRe) => {
  assertIndexConvention(index, indexConventionRe);

  return parseInt(index.match(indexConventionRe)[1], 10);
};

/**
 * A simple Error constructor which takes an inner error so we can gracefully
 *   add sensible messages while not losing the original cause of the error.
 */
function OuterError(msg, innerErr) {
  this.message = msg;
  this.stack = (new Error()).stack;
  this.innerError = innerErr;
}



/**
 * Applies elasticsearch's '_reindex' operation
 * https://www.elastic.co/guide/en/elasticsearch/reference/6.2/docs-reindex.html
 *
 * @param {object} httpEs
 * @param {string} latestIndex
 * @param {string} newIndex
 * @param {string} [script]
 */
const reindex = async (httpEs, latestIndex, newIndex, script) => {
  console.log('Reindexing based on new index\n');

  const body = {
    source: { index: latestIndex },
    dest: { index: newIndex }
  };

  if (script) {
    body.script = {
      source: script,
      lang: 'painless'
    };
  }

  try {
    await httpEs.post({
      restOfUrl: '/_reindex',
      body
    });
  } catch (innerErr) {
    throw new OuterError(
      'There was an error reindexing'
      + `\nlatestIndex: ${latestIndex}`
      + `\nnewIndex: ${newIndex}`
      + `\nbody: ${prettyJSON(newIndex)}`,
      innerErr
    );
  }
};

/**
 * Removes the alias from its current index and assigns it to the the new one
 *
 * @param {object} httpEs
 * @param {string} currentIndex
 * @param {string} newIndex
 * @param {string} alias
 */
const updateAlias = async (httpEs, currentIndex, newIndex, alias) => {
  console.log(`updating the alias '${alias}'`);

  const body = {
    actions: [
      {
        remove: {
          index: currentIndex,
          alias
        }
      },
      {
        add: {
          index: newIndex,
          alias
        }
      }
    ]
  };

  try {
    await httpEs.post({
      restOfUrl: '_aliases',
      body
    });
  } catch (innerErr) {
    throw new OuterError(
      'there was an error adding a new alias'
      + `\ncurrentIndex: ${currentIndex}`
      + `\nnewIndex: ${newIndex}`
      + `\nalias: ${alias}`
      + `\nbody: ${prettyJSON(body)}`,
      innerErr
    );
  }
};

module.exports = {
  assertIndexConvention,
  getMappings,
  getRecentAndNewIndexes,
  getSettings,
  reindex,
  updateAlias
};
