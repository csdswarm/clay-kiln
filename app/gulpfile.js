'use strict';
var gulp = require('gulp'),
  argv = require('yargs').argv,
  buildMegabundle = require('./gulp/tasks/build-megabundle'),
  _toInt = require('lodash/toInteger'),
  // load tasks that are in external files
  hubRegistry = require('gulp-hub'),
  hub = new hubRegistry(['./gulp/tasks/*.js']);

// load those tasks that were in external files
gulp.registry(hub);

// to render component templates, we need to run scripts AFTER media
// note: you can run `scripts` or `media` independent of each other,
// we just care about ordering when running the `default` task
gulp.task('default', gulp.series('styles', 'media', 'scripts'));

gulp.task('watch', function () {

  // scripts
  gulp.watch(['global/js/**', '!global/js/editor/*.js'], gulp.series('view-before', 'view-after'));
  gulp.watch(['global/kiln/**/*.js'], gulp.series('edit-before'));

  // media
  gulp.watch('components/**/media/**', gulp.series('component-media'));
  gulp.watch('sites/**/media/**', gulp.series('site-media'));

  // fonts
  gulp.watch('sites/**/fonts/**', gulp.series('fonts'));

  // templates
  gulp.watch([ 'components/**/*.handlebars', 'components/**/*.hbs' ], gulp.series('component-templates'));

  // models
  return buildMegabundle({
    compact: argv.compact || _toInt(process.env.COMPACT_BUILD) === 1,
    verbose: argv.verbose,
    watch: true
  });
});
