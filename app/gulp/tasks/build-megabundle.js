'use strict';
const fs = require('fs-extra'),
  path = require('path'),
  browserify = require('browserify'),
  glob = require('glob'),
  babelify = require('babelify'),
  browserifyExtractRegistry = require('browserify-extract-registry'),
  browserifyExtractIds = require('browserify-extract-ids'),
  browserifyGlobalPack = require('browserify-global-pack'),
  bundleCollapser = require('bundle-collapser/plugin'),
  through2 = require('through2'),
  _ = require('lodash'),
  gaze = require('gaze'),
  vueify = require('vueify'),
  transformTools = require('browserify-transform-tools'),
  extractCSS = require('vueify/plugins/extract-css'),
  pathUtil = require('path'),
  resolve = require('resolve').sync,
  BASE_DIR = path.resolve(__dirname, '..', '..'),
  COMPONENT_DIR = path.join(BASE_DIR, 'components'),
  GLOBAL_DIR = path.join(BASE_DIR, 'global', 'js'),
  KILN_PATH = path.resolve('./global/kiln/index.js'),
  REGISTRY_PATH = path.resolve('.', 'public', 'js', 'registry.json'),
  MEGABUNDLE_DIR = path.resolve('.', 'public', 'js'),
  IDS_PATH = path.resolve('.', 'public', 'js', 'ids.json'),
  ENV_PATH = path.resolve('.', 'client-env.json'),
  // paths or globs to megabundle entry files
  ENTRY_GLOBS = [
    'components/*/model.js',
    'components/*/client.js',
    './global/js/*.js',
    './global/kiln/index.js'
  ],
  DEPS_PER_OUTFILE = 100;


/**
 * Generate a browserify-transform that replaces all require calls
 * resolving to the module with a specified string.
 * @param {string} moduleId
 * @param {string} rewrite
 * @returns {object} browserify transform
 */
function rewriteRequire(moduleId, rewrite) {
  const modulePath = require.resolve(moduleId);

  return transformTools.makeRequireTransform('requireTransform',
    {evaluateArguments: true},
    ([path], {file}, cb) => {
      const absolutePath = resolve(path, {basedir: pathUtil.dirname(file)});

      return absolutePath === modulePath ? cb(null, rewrite) : cb();
    });
}

/**
 * Re-writes requires to `services/server` to `services/client`
 *
 * @return {function}
 */
function rewriteServiceRequire() {
  return transformTools.makeRequireTransform('requireTransform',
    {evaluateArguments: true},
    ([path], {file}, cb) => {
      var parsedRequire = pathUtil.parse(path), // Parse the require path
        parsedRequiredBy = pathUtil.parse(file), // Parse the file path
        absoluteRequirePath = pathUtil.resolve(parsedRequiredBy.dir, parsedRequire.dir),
        isServerSideService = _.endsWith(absoluteRequirePath, '/services/server'),// Does it lead to the server-side directory?
        absoluteClientPath = pathUtil.resolve(absoluteRequirePath, '../../services/client', parsedRequire.name);

      // Let's test if the client-side version of the service exists. If it doesn't then this task
      // is going to haaaaaaaaaaaang so that it won't compile because streams
      if (isServerSideService && !fs.existsSync(`${absoluteClientPath}.js`)) {
        throw new Error('A server-side only service must have a client-side counterpart');
      }

      // If it's pointed to the server-side only directory then we're going to map it to the client-side
      // version of the service. This enforces that we _MUST_ have that service available.
      return isServerSideService ? cb(null, `require('${absoluteClientPath}')`) : cb();
    });
}

/**
 * Browserify plugin to replace process.env with window.process.env
 * and extract all env var nams used
 * @param {object} b Browserify instance
 * @param {object} [opts] plugin options
 * @param {function} [opts.callback]
 */
function transformEnv(b, {callback}) {
  const env = [];

  b.pipeline.get('deps').push(through2.obj(function (item, enc, cb) {
    const matches = item.source.match(/process\.env\.(\w+)/ig);

    if (matches) {
      item.source = item.source.replace(/process\.env/ig, 'window.process.env'); // reference window, so browserify doesn't bundle in `process`
      // regex global flag doesn't give us back the actual key, so we need to grab it from the match
      matches.forEach(function (match) {
        env.push(match.match(/process\.env\.(\w+)/i)[1]);
      });
    }
    cb(null, item);
  }).on('end', () => {
    if (callback) callback(null, env);
  }));
}

/**
 * Browserify plugin to filter out any modules with source files that appear
 * in a specified array, EXCEPT entry files.
 * @param {object} b
 * @param {object} [opts]
 * @param {string[]} [opts.cachedFiles] Array of cached source files
 */
function filterUnchanged(b, {cachedFiles = []}) {
  const entries = [];

  // collect entry files
  b.pipeline.get('record').push(through2.obj(function (item, enc, cb) {
    entries.push(item.file);
    cb(null, item);
  }));

  b.pipeline.get('deps').push(through2.obj(function (item, enc, cb) {
    if (_.includes(cachedFiles, item.file) && !_.includes(entries, item.file)) {
      cb();
    } else {
      cb(null, item);
    }
  }));
}

/**
 * Browserify plugin to assign module IDs to each module, replacing Browserify's
 * built-in labeler. Ensures existing modules are assigned their current IDs.
 * @param {object} b
 * @param {object} [opts]
 * @param {object} [opts.ids] Mapping of current filenames to module IDs
 * @returns {object} Browserify plugin
 */
function labeler(b, {cachedIds = {}}) {
  const getOrGenerateId = idGenerator({cachedIds});

  return b.pipeline.get('label')
    .splice(0, 1, through2.obj((item, enc, cb) => {
      item.id = getOrGenerateId(item.id);
      item.deps = _.mapValues(item.deps, (val, key) =>
        key === 'dup' ? val : getOrGenerateId(val));
      cb(null, item);
    }));
}

/**
* Returns a function that retrieves a module ID for a specified file. Defers
* to IDs in cachedIds if set.
* @param {Object} [opts]
* @param {boolean} [opts.minimal] Make all IDs reflect source file paths
* @param {Object} [opts.cachedIds] Map of file paths to previously generated IDs
* @return {function} A function that returns an ID given a specified file
**/
function idGenerator({cachedIds}) {
  const generatedIds = _.assign({}, cachedIds);
  // set to the highest number in the generateIds, or 1
  let i = _.max(_.values(generatedIds).filter(_.isFinite)) + 1 || 1;

  return file => generatedIds[file] ||
    (generatedIds[file] = getModuleId(file) || i++);
}

/**
 * Get module type from file path.
 * @param  {string} file absolute file path
 * @return {string} module type, 'model', 'client', 'kiln', or 'service'
 */
function getModuleType(file) {
  if (file.startsWith(COMPONENT_DIR)) {
    if (file.endsWith('model.js')) {
      return 'model';
    } else if (file.endsWith('client.js')) {
      return 'client';
    }
  } else if (file === KILN_PATH) {
    return 'kiln';
  } else if (file.startsWith(GLOBAL_DIR)) {
    return 'service';
  }
}

/**
 * For a given file, return its module IDs.
 * @param {string} file Absolute file path
 * @return {string} module id
 */
function getModuleId(file) {
  // e.g. '/components/clay-paragraph/model.js' becomes 'clay-paragraph.model'
  const type = getModuleType(file);

  switch (type) {
    case 'model':
      return `${file.split('/').slice(-2)[0]}.model`;
    case 'client':
      return `${file.split('/').slice(-2)[0]}.client`;
    case 'service':
      return `${path.basename(file, '.js')}.service`;
    case 'kiln':
      return 'kiln-plugins';
    default:
      return;
  }
}

/**
 * For the given dep, return the path(s) of the output file(s). If the files
 * already exist, the module will be appended to them. If this return an array,
 * the module is exported to multiple files.
 * @param {Object} dep Module-deps dependency
 * @return {string|string[]}
 */
function getOutfile(dep) {
  const id = dep.id;

  // all component models are exported to a single consolidated file
  if (_.endsWith(id, '.model')) {
    return path.join(MEGABUNDLE_DIR, 'models.js');
  // other deps live in individual files for client rendering and
  // consolidated dep-* files for Kiln (minimizes number of requests)
  } else if (_.isFinite(parseInt(id))) {
    return [
      path.join(
        MEGABUNDLE_DIR,
        `deps-${Math.floor(parseInt(id) / DEPS_PER_OUTFILE)}.js`
      ),
      path.join(MEGABUNDLE_DIR, `${id}.js`)
    ];
  }
  // everything else goes into a file reflecting its module id
  return path.join(MEGABUNDLE_DIR, `${id}.js`);
}

/**
 * Update the megabundle with changes from filepaths.
 * @param {string[]} filepaths Filepaths of files that need built or updated
 * @param {object} [opts]
 * @param {boolean} [opts.compact] Enable uglify and bundle-collapse. Slower build but shorter output.
 * @param {boolean} [opts.verbose] Logs file writes
 * @param {object} [opts.cache] Used to track data between builds so we don't need to do full rebuild on each change
 * @param {object} [opts.cache.ids] Map of absolute source file paths to module IDs
 * @param {string[]} [opts.cache.env] Array of env vars used
 * @param {object} [opts.cache.registry] Dependency registry. Maps each module ID to an array of dependency IDs
 * @param {string[]} [opts.cache.files] Array of all source files represented in the megabundle.
 * @returns {Promise}
 */
function updateMegabundle(filepaths, opts) {
  const entries = filepaths.map(file => path.resolve(file)),
    bundler = browserify({dedupe: false}),
    subcache = {};
  let cache;

  _.defaults(opts, {
    compact: false,
    verbose: false,
    cache: {}
  });
  cache = _.defaults(opts.cache, {
    ids: {},
    env: [],
    registry: {},
    files: [],
    pack: []
  });

  if (opts.verbose) console.log('updating megabundle');

  bundler
    .require(entries)
    // Transpile to ES5
    .transform(babelify.configure({
      presets: ['es2015'],
      plugins: ['transform-es2015-modules-commonjs', 'transform-async-to-generator']
    }))
    // transform behavior and pane .vue files
    .transform(vueify, {
      babel: {
        presets: ['es2015'],
        // Converts import / export syntax to CommonJS. Allows us to use that syntax if we want
        // but does NOT perform any tree-shaking
        plugins: ['transform-es2015-modules-commonjs', 'transform-async-to-generator']
      }
    })
    .plugin(extractCSS, {
      out: 'public/css/edit-before.css'
    })
    // Substitute all calls to jsdom with false, for the purify service, which uses "window" instead
    .transform(rewriteRequire('jsdom', 'false'))
    // Re-write `db` service requires to `rest` universal service requires
    .transform(rewriteServiceRequire())
    // Assign each module a module ID, defaulting to old module IDs in cache
    .plugin(labeler, {cachedIds: cache.ids})
    // Keep only entry (changed) files and new files; do not process existing, unchanged files
    .plugin(filterUnchanged, {cachedFiles: cache.files})
    // Extract the registry, an object mapping each module's IDs to an array of its
    // dependencies' IDs.
    .plugin(browserifyExtractRegistry, {
      callback: (err, data) => {
        if (err) return console.error(err);
        subcache.registry = data;
      }
    })
    // Extract module IDs, a map of source file paths to module IDs.
    // Not necessary to generate the whole megabundle, but used on updates.
    .plugin(browserifyExtractIds, {
      callback: (err, ids) => {
        if (err) return console.error(err);
        subcache.ids = ids;
        subcache.files = _.keys(ids);
      }
    })
    // Write out each chunk of the browser-pack bundle in such a way
    // that module chunks can be concatenated together arbitrarily
    .plugin(browserifyGlobalPack, {
      getOutfile,
      verbose: opts.verbose,
      cache: opts.cache.pack
    })
    // Transform process.env into window.process.env and export array of env vars
    .plugin(transformEnv, {
      callback: (err, env) => {
        if (err) return console.error(err);
        subcache.env = env;
      }
    });

  if (opts.compact) {
    bundler
      .transform({global: true, output: { inline_script: true }}, 'uglifyify') // Uglify everything
      // Shorten bundle size by rewriting require calls to use actual module IDs
      // instead of file paths
      .plugin(bundleCollapser);
  }

  return new Promise((resolve, reject) => {
    bundler.bundle()
      .on('end', () => {
        if (opts.verbose) {
          console.log(cache.ids);
        }
        // merge the subcache into the cache; overwrite, but never delete
        _.assign(cache.registry, subcache.registry);
        _.assign(cache.ids, subcache.ids);
        cache.files = _.union(subcache.files, cache.files);
        cache.env = _.union(subcache.env, cache.env);
        // export registry and env vars
        fs.outputJsonSync(REGISTRY_PATH, cache.registry);
        fs.outputJsonSync(ENV_PATH, cache.env);
        fs.outputJsonSync(IDS_PATH, cache.ids);
        if (opts.verbose) console.log('megabundle updated');
        resolve();
      })
      .on('error', reject)
      .resume(); // force the bundle read-stream to flow
  });
}

/**
* Delete existing public/js/deps-* files and public/js/models.js.
**/
function deleteExisting() {
  glob.sync(path.join('public', 'js', 'deps-*.js'))
    .concat([path.join('public', 'js', 'models.js')])
    .forEach(file => fs.removeSync(file));
}

/**
 * Build the megabundle, and optionally watch for changes.
 * @param {object} [opts]
 * @param {boolean} [opts.compact] Enable uglify and bundle-collapse
 * @param {boolean} [opts.verbose] Log file writes
 * @param {boolean} [opts.watch] Rebuild on changes to megabundle source files
 * @returns {Promise}
 */
function build({watch = false, compact = false, verbose = false}) {
  const entries = ENTRY_GLOBS
      .reduce((prev, pattern) => prev.concat(glob.sync(pattern)), [])
      .filter(i => !_.endsWith(i, '.test.js'))
      .filter(i => !_.endsWith(i, 'global/js/components.js')),
    bundleOpts = {watch, compact, verbose};

  deleteExisting();
  return updateMegabundle(entries, bundleOpts)
    .then(()=>{
      if (watch) {
        // start watching all files in the bundle and entry file locations
        const filesToWatch = bundleOpts.cache.files.concat(ENTRY_GLOBS);

        startWatching(filesToWatch, (file, watcher) => {
          updateMegabundle([file], bundleOpts, (err) => {
            if (err) console.error(err);
            watcher.add(_.keys(bundleOpts.cache.ids)); // watch new files
          });
        });
      }
    });
}

/**
 * Start watching files
 * @param {string[]} files File paths or globs to watch
 * @param {function} onUpdate Gets updated/added file path and watcher object
 */
function startWatching(files, onUpdate) {
  gaze(files, (err, watcher) => {
    if (err) console.error(err);
    watcher.on('changed', (file) => onUpdate && onUpdate(file, watcher));
    watcher.on('added', (file) => onUpdate && onUpdate(file, watcher));
  });
}

module.exports = build;
