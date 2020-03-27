'use strict';

const axios = require('axios'),
  { URL } = require('url'),
  { wrapInTryCatch } = require('../../startup/middleware-utils'),
  sectionFronts = new Set([ 'section-front', 'stations' ]),
  /**
   * determines whether the /_lists/new-pages request should pass through to
   *   clay.  This is based off two conditions
   *
   *   1. if the request has 'fromClay' as a query parameter
   *   2. if no user is associated with the request.  We want to pass this
   *      through so devs can query the list directly without being logged in.
   *      e.g. curl /_lists/new-pages.
   *
   * @param {object} req
   * @param {object} res
   * @returns {boolean}
   */
  shouldPassNewPagesRequestToClay = (req, res) => {
    return req.query.fromClay === 'true'
      || !res.locals.user;
  },
  /**
   * Creates a filter method for _list menu items that will verify that the user has permissions
   * if it is a menu item with a matching item.id
   * @param { Object } locals - The locals object
   * @param { string } pageType - The type of page to check permissions for
   * @param { string } id - The component instance id for the menu item
   * @returns { function(*): boolean }
   */
  menuItemChecker = (locals, pageType, id) =>
    item =>
      item.id !== id || locals.user.can('create').a(pageType).value;

/**
 * Adds an endpoint to the router which intercepts the 'new-pages' list and
 *   modifies the response according to the user's permissions
 *
 * @param {object} router - an express router
 */
module.exports = router => {
  router.get('/_lists/new-pages', wrapInTryCatch(async (req, res, next) => {
    if (shouldPassNewPagesRequestToClay(req, res)) {
      next();
      return;
    }

    // otherwise we need to get the data from clay core and filter the result

    // concatenation to get the full url is from here
    // https://stackoverflow.com/a/10185427
    //
    // we should declare this after the short circuit
    // eslint-disable-next-line one-var
    const urlObj = new URL(req.protocol + '://' + req.get('host') + req.originalUrl),
      { user, stationForPermissions } = res.locals,
      canCreateSectionFronts = user.can('create').a('section-front').value,
      canCreateStaticPageMenuItem = menuItemChecker(res.locals, 'static-page', 'new-static-page'),
      station = stationForPermissions.site_slug,
      options = typeof station === 'string' ? { headers: { Cookie: `station=${station};` } } : {};

    urlObj.searchParams.append('fromClay', 'true');

    // urlObj needs to be mutated before we can get the result
    // eslint-disable-next-line one-var
    const { data: newPages } = await axios.get(urlObj.toString(), options),
      filteredPages = newPages
        .filter(item => !(!canCreateSectionFronts && sectionFronts.has(item.id)))
        .map(item => ({ ...item, children: item.children.filter(canCreateStaticPageMenuItem) }));

    res.send(filteredPages);
  }));
};
