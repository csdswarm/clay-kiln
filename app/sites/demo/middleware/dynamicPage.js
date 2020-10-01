'use strict';

const dynamicPage = ( req, res, next ) => {

  if (res.locals.edit) res.locals.isDynamicPage = true;
  
  next();
};

module.exports = {
  dynamicPage
};
