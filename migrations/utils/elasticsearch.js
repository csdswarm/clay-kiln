'use strict';

/**
 * README
 *  - This copied and refactored from
 *    'https://bitbucket.org/entercom/clay-radio/src/82ed8c7fc80bbc2f57673d98da19db96fbeccb77/migrations/legacy/elasticsearch.js?at=ON-1068-add-station-logic-to-content-type'
 *
 */
const { _identity, _defaults, prettyJSON } = require('./base');
const { v1: makeHttpEs } = require('./make-http-es');
const isTruthy = _identity;

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
    )
  }

  const currentIndex = indices[0];
  assertIndexConvention(currentIndex, indexConventionRe);

  return currentIndex;
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
  const curSettings = await httpEs.get.asJson(`/${currentIndex}/_settings`);

  return {
    analysis: curSettings[currentIndex].settings.index.analysis
  };
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
 * @param {string} [reindexScript]
 * @returns {undefined|string} - if updated, the new index
 */
const updateIndex = async (parsedHost, alias, fns = {}, reindexScript) => {
  assertFnsIsValid(fns);

  _defaults(fns, {
    updateMappings: _identity,
    updateSettings: _identity
  });

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
  });
  await reindex(httpEs, currentIndex, newIndex, reindexScript);
  await updateAlias(httpEs, latestIndex, newIndex, alias);
  return newIndex;
};

const v1 = { updateIndex };

module.exports = { v1 };
