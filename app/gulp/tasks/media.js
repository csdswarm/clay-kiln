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

gulp.task('component-media', function () {
  var streams = [];

  _.forOwn(componentUtil.getMediaMap(), function (glob, component) {
    var stream = gulp.src(glob)
      .pipe(rename(function (filePath) {
        filePath.dirname = path.join('components', component);
      }))
      .pipe(changed(path.join('public', 'media')))
      .pipe(gulp.dest(path.join('public', 'media')));

    streams.push(stream);
  });

  return merge(streams);
});

gulp.task('site-media', function () {
  return gulp.src('sites/**/media/*.+(jpg|jpeg|png|gif|webp|svg|ico)')
    .pipe(rename(function (filePath) {
      filePath.dirname = path.join('sites', getSiteName(filePath.dirname));
    }))
    .pipe(changed(path.join('public', 'media')))
    .pipe(gulp.dest('public/media'));
});

// combine them into a media task
gulp.task('media', gulp.parallel('site-media', 'component-media'));
