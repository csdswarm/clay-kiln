'use strict';

/**
 * README
 *  - This copied and refactored from
 *    'https://bitbucket.org/entercom/clay-radio/src/82ed8c7fc80bbc2f57673d98da19db96fbeccb77/migrations/legacy/elasticsearch.js?at=ON-1068-add-station-logic-to-content-type'
 *
 */
const { _identity, _defaults, prettyJSON } = require('./base'),
  makeHttpEs = require('./make-http-es'),
  {
    assertIndexConvention,
    getMappings,
    getRecentAndNewIndexes,
    getSettings,
    OuterError,
    reindex,
    updateAlias
  } = require('./utils');

/**
 * Returns the index which the alias points to
 *
 * @param {object} httpEs
 * @param {string} alias
 * @param {RegExp} indexConventionRe
 */
const getCurrentIndex = async (httpEs, alias, indexConventionRe) => {
  const resp = await httpEs.get.asJson(`/${alias}/_alias`),
    indices = Object.keys(resp);

  if (indices.length > 1) {
    throw new Error(
      'Currently there are multiple indices'
      + `\nalias checked: ${alias}`
      + `\naliases found: ${prettyJSON(indices)}`
    );
  }

  const currentIndex = indices[0];
  assertIndexConvention(currentIndex, indexConventionRe);

  return currentIndex;
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
    );
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
 * @param {string} [reindexScript]
 * @returns {undefined|string} - if updated, the new index
 */
const makeUpdateIndex = makeHttpEs => async (parsedHost, alias, fns = {}, reindexScript) => {
  assertFnsIsValid(fns);

  _defaults(fns, {
    updateMappings: _identity,
    updateSettings: _identity
  });

  const httpEs = makeHttpEs(parsedHost),
    indexConventionRe = new RegExp(`^${alias}_v(\\d+)$`),
    currentIndex = await getCurrentIndex(httpEs, alias, indexConventionRe),
    { latestIndex, newIndex } = await getRecentAndNewIndexes(httpEs, alias, indexConventionRe),
    settings = await getSettings(httpEs, currentIndex),
    mappings = await getMappings(httpEs, currentIndex);

  if (!fns.shouldUpdate(mappings, settings)) {
    return;
  }

  await createNewElasticsearchIndex(httpEs, newIndex, {
    mappings: fns.updateMappings(mappings),
    settings: fns.updateSettings(settings)
  });
  await reindex(httpEs, currentIndex, newIndex, reindexScript);
  await updateAlias(httpEs, latestIndex, newIndex, alias);
  return newIndex;
};

module.exports = {
  v1: makeUpdateIndex(makeHttpEs.v1),
  v2: makeUpdateIndex(makeHttpEs.v2)
};
