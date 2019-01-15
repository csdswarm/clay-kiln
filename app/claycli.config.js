'use strict';

var gulp = require('gulp'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  gutil = require('gulp-util'),
  argv = require('yargs').argv,
  gulpif = require('gulp-if');

module.exports = {
  customTasks: [
    {
      name: 'polyfills',
      fn: () => {
        return gulp.src([
          'global/polyfills.js',
          'global/modernizr.js'
        ])
          .pipe(concat('polyfills.js'))
          .pipe(gulpif(!argv.debug, uglify())).on('error', gutil.log)
          .pipe(gulp.dest('public/js'));
      }
    }
  ],
  plugins: [
    require('postcss-functions')({
      functions: {
        em: function (pixels, browserContext) {
          var browserContext = parseInt(browserContext, 10) || 16,
            pixels = parseFloat(pixels);
          return pixels / browserContext + 'em';
        },
        widthOnGrid: function (columns, gutters, windowWidth) {
          var width;
          switch (windowWidth) {
            case 'medium-screen':
              width = columns * 101 + gutters * 20;
              break;
            case 'medium-small-screen':
              width = columns * 95 + gutters * 20;
              break;
            case 'small-screen':
              width = columns * 65 + gutters * 20;
              break;
            default:
              width = columns * 60 + gutters * 20;
          }
          return width + 'px';
        }
      }
    })
  ],
  babelTargets: { browsers: ['> 2%'] },
  autoprefixerOptions: { browsers: ['> 2%'] }
};
