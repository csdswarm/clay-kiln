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

  // these shouldn't be declared above the short circuit
  // eslint-disable-next-line one-var
  const { locals } = res,
    { stationForPermissions, user } = locals,
    // only static-page has 'update' permissions currently
    showNoEditPermissionsBanner = pageType === 'static-page'
      ? !user.can('update').a(pageType).value
      : !user.can('access').this('station').value,
    stationName = stationForPermissions.name;

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
 *  - showLackOfEditPermissionsBanner {boolean}
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
        { station, user } = locals,
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
          showLackOfEditPermissionsBanner: !user.can('access').this('station').value,
          updateTarget: `this page for ${station.name}`
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
