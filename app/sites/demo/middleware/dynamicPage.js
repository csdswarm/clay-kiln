'use strict';

const dynamicPageMiddleware = ( req, res, next ) => {
  const { edit } = res.locals;

  if (edit) res.locals.isDynamicPage = true;
  next();
};

module.exports = {
  dynamicPageMiddleware
};
