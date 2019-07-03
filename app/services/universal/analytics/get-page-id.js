'use strict';

const makeFromPathname = require('./make-from-pathname');

module.exports = ({ pageData, pathname }) => {
  const fromPathname = makeFromPathname({ pathname });

  return fromPathname.getPageId(pageData);
};
