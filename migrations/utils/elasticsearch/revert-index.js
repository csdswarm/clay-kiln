'use strict';

const makeHttpEs = require('./make-http-es'),
  {
    getMappings,
    getRecentAndNewIndexes,
    getSettings,
    reindex,
    updateAlias
  } = require('./utils');

/**
 * Reverts a recent updatedIndex to the previous index
 * @param {object} parsedHost
 * @param {string} alias
 * @param {function} shouldUpdate
 * @returns {Promise<string>}
 */
const revertIndex = async (parsedHost, alias, shouldUpdate) => {
  const httpEs = makeHttpEs.v1(parsedHost),
    indexConventionRe = new RegExp(`^${alias}_v(\\d+)$`),
    { latestIndex, previousIndex } = await getRecentAndNewIndexes(httpEs, alias, indexConventionRe),
    settings = await getSettings(httpEs, latestIndex),
    mappings = await getMappings(httpEs, latestIndex);

  if (!shouldUpdate(mappings, settings)) {
    return;
  }

  await reindex(httpEs, latestIndex, previousIndex);
  await updateAlias(httpEs, latestIndex, previousIndex, alias);
  return previousIndex;
};

module.exports = { v1: revertIndex };
