'use strict';
var gulp = require('gulp'),
  changed = require('gulp-changed'),
  rename = require('gulp-rename'),
  path = require('path'),
  _ = require('lodash'),
  merge = require('merge-stream'),
  componentUtil = require('../util/components');

function getSiteName(filePath) {
  var pathArr = filePath.split(path.sep);

  return pathArr[0];
}

gulp.task('component-fonts', function () {
  var streams = [];

  _.forOwn(componentUtil.getFontsMap(), function (glob, component) {
    var stream = gulp.src(glob)
      .pipe(rename(function (filePath) {
        filePath.dirname = path.join('components', component);
      }))
      .pipe(changed(path.join('public', 'fonts')))
      .pipe(gulp.dest(path.join('public', 'fonts')));

    streams.push(stream);
  });

  return merge(streams);
});

gulp.task('site-fonts', function () {
  return gulp.src('sites/**/fonts/*.+(woff|woff2|otf|ttf|eot|svg)')
    .pipe(rename(function (filePath) {
      filePath.dirname = path.join('sites', getSiteName(filePath.dirname));
    }))
    .pipe(changed(path.join('public', 'fonts')))
    .pipe(gulp.dest('public/fonts'));
});

// combine them into a fonts task
gulp.task('fonts', gulp.parallel('site-fonts', 'component-fonts'));
