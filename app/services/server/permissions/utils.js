'use strict';

const pageTypesToCheck = new Set([
    'homepage',
    'section-front',
    'static-page',
    'station-front'
  ]),
  unsafeMethods = new Set([
    'DELETE',
    'POST',
    'PATCH',
    'PUT'
  ]);

module.exports = {
  pageTypesToCheck,
  unsafeMethods
};
