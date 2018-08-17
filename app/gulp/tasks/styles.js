'use strict';

const autoprefixer = require('autoprefixer'),
  changedInPlace = require('gulp-changed-in-place'),
  prefixOptions = { browsers: ['last 2 versions', 'ie >= 9', 'ios >= 7', 'android >= 4.4.2'] },
  cssmin = require('gulp-cssmin'),
  gulp = require('gulp'),
  postcss = require('gulp-postcss'),
  mixins = require('postcss-mixins'),
  nested = require('postcss-nested'),
  atImport = require('postcss-import'),
  simpleVars  = require('postcss-simple-vars'),
  rename = require('gulp-rename'),
  postCssFunctions = require('../util/postcss-functions'),
  functions = require('postcss-functions')({
    functions: postCssFunctions
  });

function getVars() {
  return {
    variables: {
      'edit-ui-font': 'Helvetica,Arial,sans-serif',
      'edit-blue-2': '#8bc0d4'
    }
  }
}

function renameFile(filepath) {
  const component = filepath.basename,
    styleguide = filepath.dirname.split('/')[0];

  filepath.dirname = '';
  filepath.basename = `${component}.${styleguide}`;
}

gulp.task('process-css', function () {
  return gulp.src('styleguides/*/components/*.css')
    .pipe(changedInPlace(
      {
        firstPass: true
      }
    ))
    // .pipe(changed('public/css', {transformPath: renameFile}))
    .pipe(rename(renameFile))
    .pipe(postcss(
      // postcss plugins
      [
        atImport({
          root: `${process.cwd()}/styleguides`
        }),
        mixins(),
        simpleVars(getVars()),
        nested(),
        autoprefixer(prefixOptions),
        functions
      ]
    ))
    .pipe(cssmin())
    .pipe(gulp.dest('public/css'));
});

gulp.task('styles', gulp.series('process-css'));
