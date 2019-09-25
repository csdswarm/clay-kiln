'use strict';

/**
 * README
 *  - This code is based off
 *    '20190719171300-add-new-syndication-stations/updateElasticsearchMapping.js'
 */

const makeHttpEs = require('./make-http-es').v1,
  _set = require('../../app/node_modules/lodash/set'),
  _identity = require('../../app/node_modules/lodash/identity'),
  _defaults = require('../../app/node_modules/lodash/defaults'),
  isTruthy = _identity;

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
 * Yes this is copied from migration-utils.js.  I can't require that file
 *   because it would cause a circular dependency.  Ideally we'd restructure our
 *   migrations so we could stuff the utilities in a directory and organize it
 *   there, but I'm punting on that for now.
 */
const prettyJSON = obj => JSON.stringify(obj, null, 2);

/**
 * A function meant for Array.prototype.sort which sorts in descending order
 *
 * @param {number} left
 * @param {number} right
 * @returns {number}
 */
const descending = (left, right) => right - left;

/**
 * Returns the index which the alias points to
 *
 * @param {string} esUrl
 * @param {string} protocol
 * @param {string} alias
 */
const getCurrentIndex = async (httpEs, alias, indexConventionRe) => {
  const resp = await httpEs.get.asJson(`/${alias}/_alias`),
    indices = Object.keys(resp);

  if (indices.length > 1) {
    throw new Error(
      'Currently there are multiple indices'
      + `\nalias checked: ${alias}`
      + `\naliases found: ${prettyJSON(indices)}`
    )
  }

  const currentIndex = indices[0];
  assertIndexConvention(currentIndex, indexConventionRe);

  return currentIndex;
};

/**
 * Gets the version from the currentIndex
 *
 * @param {string} currentIndex
 * @param {RegExp} indexConventionRe
 * @returns {number}
 */
const getVersion = (index, indexConventionRe) => {
  assertIndexConvention(index, indexConventionRe);

  return parseInt(index.match(indexConventionRe)[1], 10);
};

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
 * @param {object} httpEs
 * @param {string} alias
 * @param {RegExp} indexConventionRe
 */
const getLatestAndNewIndex = async (httpEs, alias, indexConventionRe) => {
  // the 'h' param is documented here:
  // https://www.elastic.co/guide/en/elasticsearch/reference/6.2/cat.html#headers
  const resp = await httpEs.get.asText(`/_cat/indices/${alias}*?h=index`),
    latestVersion = resp.split('\n')
      .filter(isTruthy)
      .map(index => getVersion(index, indexConventionRe))
      .sort(descending)[0];

  return {
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
  const curSettings = await httpEs.get.asJson(`/${currentIndex}/_settings`),
    newSettings = {
      analysis: curSettings[currentIndex].settings.index.analysis
    };

  return newSettings;
};

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
 * Creates the new index with the contents of 'body'
 *
 * @param {object} httpEs
 * @param {string} newIndex
 * @param {*} body
 */
const createNewElasticsearchIndex = async (httpEs, newIndex, body) => {
  console.log(`Creating new elasticsearch index '${newIndex}'`);

  try {
    await httpEs.put({
      restOfUrl: newIndex,
      body
    });
  } catch (innerErr) {
    throw new OuterError(
      `There was an error creating the elasticsearch index '${newIndex}'`
      + `\nbody: ${prettyJSON(body)}`,
      innerErr
    );
  }
};

/**
 * Applies elasticsearch's '_reindex' operation
 * https://www.elastic.co/guide/en/elasticsearch/reference/6.2/docs-reindex.html
 *
 * @param {object} httpEs
 * @param {string} latestIndex
 * @param {string} newIndex
 */
const reindex = async (httpEs, latestIndex, newIndex) => {
  console.log('Reindexing based on new index\n');

  const body = {
    source: { index: latestIndex },
    dest: { index: newIndex }
  };

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
}

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
      { remove: {
        index: currentIndex,
        alias
      }},
      { add: {
        index: newIndex,
        alias
      }}
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
}

/**
 * ensures
 *  1. shouldUpdate was passed and
 *  2. either updateMappings or updateSettings was passed
 *
 * @param {object} fns
 */
const assertFnsIsValid = fns => {
  const fnsIsValid = (
    fns.shouldUpdate
    && (
      fns.updateMappings
      || fns.updateSettings
    )
  );

  if (!fnsIsValid) {
    throw new Error(
      "fns must have 'shouldUpdate' and either 'updateMappings' or 'updateSettings'"
    )
  }
};

/**
 * This uses the alias to find its associated index and updates the index to the
 *   next available version with the new mappings and/or settings.
 *
 * The third parameter 'fns' is an object which allows you to pass three
 *   functions that are further described below
 *   - shouldUpdate (required)
 *   - updateMappings
 *   - updateSettings
 *
 * Note: Either updateMappings or updateSettings must be passed
 *
 * shouldUpdate
 *   - signature (currentIndexMappings, currentIndexSettings) => boolean
 *   - the purpose for this function is to allow you to check whether your
 *     update has already been applied
 * updateMappings
 *   - defaults to _.identity
 *   - signature (currentIndexMappings) => newMappings
 *   - note: you don't have to worry about cloning the passed in current
 *     mappings - you can mutate it and return the result
 * updateSettings
 *   - defaults to _.identity
 *   - signature (currentIndexSettings) => newSettings
 *   - note: for whatever reason 'settings' in this case is an object limited to
 *     the 'analysis' property because that's all we've been updating thus far.
 *   - another note: same as updateMappings, you are free to mutate the current
 *     settings and return the result
 *
 * @param {object} parsedHost
 * @param {string} alias
 * @param {object} fns
 * @returns {undefined|string} - if updated, the new index
 */
const updateIndex = async (parsedHost, alias, fns = {}) => {
  assertFnsIsValid(fns);

  _defaults(fns, {
    updateMappings: _identity,
    updateSettings: _identity
  })

  const httpEs = makeHttpEs(parsedHost),
    indexConventionRe = new RegExp(`^${alias}_v(\\d+)$`),
    currentIndex = await getCurrentIndex(httpEs, alias, indexConventionRe),
    { latestIndex, newIndex } = await getLatestAndNewIndex(httpEs, alias, indexConventionRe),
    settings = await getSettings(httpEs, currentIndex),
    mappings = await getMappings(httpEs, currentIndex);

  if (!fns.shouldUpdate(mappings, settings)) {
    return;
  }

  await createNewElasticsearchIndex(httpEs, newIndex, {
    mappings: fns.updateMappings(mappings),
    settings: fns.updateSettings(settings)
  })
  await reindex(httpEs, currentIndex, newIndex);
  await updateAlias(httpEs, latestIndex, newIndex, alias)
  return newIndex;
};

const v1 = { updateIndex };

module.exports = { v1 };
