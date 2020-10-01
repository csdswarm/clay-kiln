'use strict';

/**
  * adds 'isDynamicPage' onto locals for dynamic pages.
  * @param {object} req
  * @param {object} res
  * @param {object} next
  * @returns {Promise<object>}
  */
const dynamicPage = ( req, res, next ) => {
  if (res.locals.edit) res.locals.isDynamicPage = true;
  
  next();
};

module.exports = {
  dynamicPage
};
