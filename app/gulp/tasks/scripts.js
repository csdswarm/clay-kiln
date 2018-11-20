'use strict';
var gulp = require('gulp'),
  ignore = require('gulp-ignore'),
  concat = require('gulp-concat'),
  hasFolderChanged = require('gulp-folder-changed'),
  groupConcat = require('gulp-group-concat'),
  map = require('vinyl-map2'),
  sourcemaps = require('gulp-sourcemaps'),// eslint-disable-line no-unused-vars
  uglify = require('gulp-uglify'),
  rawUglify = require('uglify-js'),
  gutil = require('gulp-util'),
  path = require('path'),
  { getComponentName, getComponentPath } = require('amphora-fs'),
  componentUtil = require('../util/components'),
  argv = require('yargs').argv,
  gulpif = require('gulp-if'),
  _ = require('lodash'),
  clayHbs = require('clayhandlebars'),
  hbs = clayHbs(),
  buildMegabundle = require('./build-megabundle'),
  fs = require('fs-extra'),
  logger = require('../../services/universal/log'),
  log = logger.setup({ file: __filename }),
  escape = require('escape-quotes');

function buildComponentJs() {
  // move (already-compiled) kiln application js
  fs.copy('./node_modules/clay-kiln/dist/clay-kiln-edit.js', './public/js/clay-kiln-edit.js');
  fs.copy('./node_modules/clay-kiln/dist/clay-kiln-view.js', './public/js/clay-kiln-view.js');
  fs.copy('./global/kiln/edit-after.js', './public/js/edit-after.js'); // mounts models and plugins
  return buildMegabundle({
    compact: argv.compact || _.toInteger(process.env.COMPACT_BUILD) === 1,
    verbose: argv.verbose,
    watch: argv.watch
  });
}

gulp.task('component-js', function () {
  return buildComponentJs();
});

gulp.task('component-models', function () {
  log('warn', 'The gulp task "component-models" is deprecated; running "component-js" instead.');
  return buildComponentJs();
});

gulp.task('component-scripts', function () {
  log('warn', 'The gulp task "component-scripts" is deprecated; running "component-js" instead.');
  return buildComponentJs();
});

/**
 * replace `{{{ read 'file' }}}` helper with inlined file contents,
 * so they can be rendered client-side
 * note: this only replaces straight file reads, not reads from dynamic filepaths
 * note: we are explicitly ignoring clay-kiln, as it has other logic for inlining icons
 * @param  {string} source
 * @return {string}
 */
function inlineRead(source) {
  const staticIncludes = source.match(/\{\{\{\s?read\s?'(.*?)'\s?\}\}\}/ig);

  let inlined = source;

  _.each(staticIncludes, function (match) {
    const filepath = match.match(/'(.*?)'/)[1];

    let fileContents;

    try {
      fileContents = escape(fs.readFileSync(filepath, 'utf8')); // read file, then escape any single-quotes
    } catch (e) {
      console.error(e);
      process.exit(1);
    }

    inlined = inlined.replace(match, fileContents);
  });
  return inlined;
}

gulp.task('component-templates', function () {
  return gulp.src(componentUtil.getList('templates'), {allowEmpty: true})
    .pipe(gulpif(argv.debug, ignore.include(hasFolderChanged(path.join('public', 'js', ':dirname.template:ext'), {
      parentName: getComponentName,
      parentDir: getComponentPath
    }))))
    // wrap templates so they don't render without data, see https://github.com/clay/handlebars/blob/master/index.js#L45
    // then precompile the templates
    .pipe(map(function (code, filename, done) {
      var source = code.toString('utf-8'),
        inlined = _.includes(filename, 'clay-kiln') ? source : inlineRead(source),
        optionalTemplate = clayHbs.wrapPartial(_.last(path.dirname(filename).split(path.sep)), inlined),
        precompiled;

      try {
        precompiled = hbs.precompile(optionalTemplate);
        done(null, precompiled);
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    }))
    .pipe(map(function (code, filename, done) {
      // inline scripts really hate dealing with `</script>` tags in strings,
      // so break them up (AFTER minifying) in case any template includes them
      var name = _.last(path.dirname(filename).split(path.sep)),
        source = `window.kiln.componentTemplates['${name}']=${code.toString('utf-8')}\n`,
        minified;

      try {
        minified = rawUglify.minify(source, {fromString: true, output: {inline_script: true}});

        // have the templates register themselves when added to the page
        done(null, minified.code);
      } catch (e) {
        console.error(e);
        done(e);
      }
    }))
    .pipe(groupConcat(componentUtil.getTemplatesMap()))
    // don't uglify templates again, as it breaks the sanitization we did above
    .pipe(gulp.dest('public/js'));
});

gulp.task('view-before', function () {
  return gulp.src([
    'global/js/view-before/**'
  ])
    .pipe(concat('view-before.js'))
    .pipe(gulpif(!argv.debug, uglify())).on('error', gutil.log)
    .pipe(gulp.dest('public/js'));
});

gulp.task('view-after', function () {
  return gulp.src([
    'global/view-after.js'
  ])
    .pipe(concat('view-after.js'))
    .pipe(gulpif(!argv.debug, uglify())).on('error', gutil.log)
    .pipe(gulp.dest('public/js'));
});

gulp.task('polyfills', function () {
  return gulp.src([
      'global/polyfills.js',
      'global/modernizr.js'
    ])
    .pipe(concat('polyfills.js'))
    .pipe(gulpif(!argv.debug, uglify())).on('error', gutil.log)
    .pipe(gulp.dest('public/js'));
});

gulp.task('scripts', gulp.parallel(['polyfills', 'view-before', 'view-after', 'component-js', 'component-templates']));
