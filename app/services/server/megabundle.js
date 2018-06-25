'use strict';

const _ = require('lodash'),
  path = require('path'),
  glob = require('glob'),
  REGISTRY = require('./../../public/js/registry.json') || {},
  SERVICES = Object.keys(REGISTRY)
    .filter(key => key.endsWith('.service')),
  DEPS_FILES = glob.sync('./public/js/deps-*.js')
    .map(filepath => path.parse(filepath).name);

/**
 * Convert a module ID to a public path
 *
 * @param  {string} moduleId  e.g. 'foo'
 * @param  {string} assetPath e.g. '/thecut/'
 * @return {string} e.g. '/thecut/js/foo.js'
 */
function idToPublicPath(moduleId, assetPath) {
  return `${assetPath}/js/${moduleId}.js`;
}

/**
 * Converts a public asset path to a module ID.
 * @param {string} publicPath e.g. https://localhost.cache.com/media/js/tags.client.js
 * @return {string} e.g. tags.client
 */
function publicPathToId(publicPath) {
  return publicPath.split('/').pop().replace('.js', '');
}

/**
 * From an array of entry module IDs and a registry of all modules and
 * their dependencies, return the IDs of all needed modules
 *
 * @param  {string[]} entryIds
 * @param  {Object} registry
 * @return {string[]}
 * @example
 * // returns ['a', 'b', 'c']
 * computeDependencies(['a', 'b'], {a: ['b', 'c'], b: ['c'], c: []})
 */
function computeDependencies(entryIds, registry) {
  const out = {},
    addDep = (dep) => {
      if (out[dep]) return;
      out[dep] = true;

      if (!registry[dep]) {
        console.log('\n\n', dep, registry, '\n\n');
      }
      registry[dep].forEach(addDep);
    };

  entryIds.forEach(addDep);

  // For now, we want to include all these global services on every page because
  // we don't know what legacy component client.js using Dollar Slice may
  // need them.
  SERVICES.forEach(addDep);

  return Object.keys(out);
}


/**
 * From an array of script paths from mediaObject.scripts,
 * return an array of scripts paths of all megabundle
 * scripts needed by the requested page
 *
 * @param  {boolean}  editMode
 * @param  {string[]}  scripts Script paths from Amphora, e.g. ['/thecut/js/a.client.js']
 * @param  {string} assetPath
 * @return {string[]}
 */
function getDeps(editMode, scripts, assetPath) {
  if (editMode) {
    return _.flatten([
      'prelude',
      DEPS_FILES,
      'kiln-plugins',
      'models',
      'postlude'
    ]).map(id => idToPublicPath(id, assetPath));;
  } else {
    const entryIds = scripts.map(publicPathToId);

    return _.flatten([
      'prelude',
      computeDependencies(entryIds, REGISTRY),
      'postlude'
    ]).map(id => idToPublicPath(id, assetPath));
  }
}

module.exports.getDeps = getDeps;
