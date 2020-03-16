'use strict';

const { getComponentName, isPage } = require('clayutils'),
  db = require('amphora-storage-postgres'),
  _get = require('lodash/get'),
  log = require('../../../universal/log').setup({ file: __filename }),
  claySiteHost = process.env.CLAY_SITE_HOST,
  typesOfPages = {
    article: 'articles',
    gallery: 'galleries',
    homepage: 'the home page',
    'section-front': 'section fronts',
    'static-page': 'static pages'
  };

/**
 * A helper method which attaches the information to locals via a page uri.
 *
 * @param {string} uri - a valid page uri
 * @param {object} res - the middleware response
 */
async function attachToLocalsUsingPageUri(uri, res) {
  const pageData = await db.get(uri),
    pageType = getComponentName(_get(pageData, 'main[0]'));

  // as far as I know a page should always have a main component, but if it
  //   doesn't then we should let downstream handle the request.
  if (!pageType) {
    return;
  }

  const { locals } = res,
    { stationForPermissions, user } = locals,
    { site_slug } = stationForPermissions,
    stationName = stationForPermissions.name,
    // only static-page has 'update' permissions currently
    // it's worth noting that in the future when urps is able to handle
    //   adding/removing/editing permission targets it may make sense to ensure
    //   a permission target and action pair exists for each content type
    //   instead of singing them out in the code like this.
    showNoEditPermissionsBanner = pageType === 'static-page'
      ? !user.can('update').a(pageType).value
      : !locals.stationsIHaveAccessTo[site_slug];

  Object.assign(locals, {
    showNoEditPermissionsBanner,
    updateTarget: `${typesOfPages[pageType] || 'this page'} for ${stationName}`
  });
}

/**
 * This function tests to see if the request is a published uri.  If it is, then
 *   its page uri is returned;
 *
 * @param {object} req
 * @returns {string|undefined}
 */
async function ifPublishedUriGetPageUri(req) {
  // this code was borrowed from amphora v7.3.2
  // lib/render.js -> renderExpressRoute (line 268)
  const pathToEncode = req.hostname + req.baseUrl + req.path,
    uriKey = claySiteHost
      + '/_uris/'
      + Buffer.from(pathToEncode, 'utf8').toString('base64');

  try {
    return await db.get(uriKey);
  } catch (err) {
    // if it wasn't found then we'll let downstream handle the request
    if (err.name !== 'NotFoundError') {
      throw err;
    }
  }
}

/**
 * Upon editing a page, this middleware attaches information to locals which
 *   determines whether the user can update the page.
 *
 * the following properties are attached
 *  - showNoEditPermissionsBanner {boolean}
 *  - updateTarget {string}
 *
 * @param {object} router
 */
module.exports = router => {
  router.get('/*', async (req, res, next) => {
    try {
      const { edit, stationForPermissions } = res.locals;

      // if we're not in edit mode or a station for permissions couldn't be
      //   determined, then there's nothing to be done.
      if (!edit || stationForPermissions === null) {
        next();
        return;
      }

      // eslint-disable-next-line one-var
      const { uri } = req,
        { locals } = res,
        { site_slug } = stationForPermissions,
        pageUri = isPage(uri)
          ? uri
          : await ifPublishedUriGetPageUri(req);

      if (pageUri) {
        await attachToLocalsUsingPageUri(pageUri, res);
      } else {
        // if it's not a page or a published uri then they must be editing a
        //   dynamic page or some other content I'm unaware of.  To be safe
        //   we're just going to assign the info based on the current station.
        Object.assign(locals, {
          showNoEditPermissionsBanner: !locals.stationsIHaveAccessTo[site_slug],
          updateTarget: `this page for ${stationForPermissions.name}`
        });
      }

      next();
    } catch (error) {
      log(
        'error',
        'There was an error trying to check for update privileges for'
        + ` user: ${res.locals.user.username} on page: ${req.uri}`,
        error
      );
    }
  });
};
