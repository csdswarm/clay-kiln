'use strict';

const dynamicPageMiddleware = ( req, res, next ) => {

  if (res.locals.edit) res.locals.isDynamicPage = true;
  
  next();
};

module.exports = {
  dynamicPageMiddleware
};
