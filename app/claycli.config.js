'use strict';

var gulp = require('gulp'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  gutil = require('gulp-util'),
  argv = require('yargs').argv,
  gulpif = require('gulp-if'),
  babel = require('gulp-babel');

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
    },
    {
      name: 'amazon-tam',
      fn: () => {
        return gulp.src([
          'global/loadAmazonAps.js'
        ])
          .pipe(gulpif(!argv.debug, uglify())).on('error', gutil.log)
          .pipe(gulp.dest('public/js'));
      }
    },
    {
      name: 'mount-modules',
      fn: () => {
        return gulp.src([
          'global/_client-init.js'
        ])
          .pipe(babel({
            presets: [
              '@babel/env'
            ],
            plugins: [
              'transform-es2015-modules-commonjs',
              '@babel/plugin-transform-async-to-generator',
              '@babel/plugin-proposal-object-rest-spread',
              '@babel/plugin-transform-runtime'
            ]
          }))
          .pipe(gulpif(!argv.debug, uglify())).on('error', gutil.log)
          .pipe(gulp.dest('./public/js/', { overwrite: true }));
      }
    },
    {
      name: 'spa-media',
      fn: () => {
        return gulp.src('public/dist/**/*.+(jpg|jpeg|png|gif|webp|svg|ico)')
          .pipe(gulp.dest('public'));
      }
    }
  ],
  plugins: [
    require('postcss-functions')({
      functions: {
        em: function (pixels, browserContext) {
          browserContext = parseInt(browserContext, 10) || 16;
          pixels = parseFloat(pixels);

          return pixels / browserContext + 'em';
        },
        widthOnGrid: function (columns, gutters, windowWidth) {
          let width;

          switch (windowWidth) {
            case 'medium-screen': // 481 to 1023px screen width
              width = columns * 101 + gutters * 20;
              break;
            case 'medium-small-screen': // 361 to 480px screen width
              width = columns * 95 + gutters * 20;
              break;
            case 'small-screen': // 360px and below screen width
              width = columns * 65 + gutters * 20;
              break;
            default: // 1023px and above screen width
              width = columns * 60 + gutters * 20;
          }
          return width + 'px';
        }
      }
    })
  ],
  babelDebug: true,
  babelTargets: { browsers: ['> 2%, ie 11'] },
  autoprefixerOptions: { overrideBrowserslist: ['> 2%, ie 11'] }
};
