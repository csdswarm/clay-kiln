'use strict';

const _get = require('lodash/get'),
  db = require('amphora-storage-postgres'),
  { isPage, isUri } = require('clayutils'),
  pathToRegexp = require('path-to-regexp'),
  urlParse = require('url-parse'),
  log = require('../../universal/log').setup({ file: __filename }),
  { routes: rdcRouteObjs } = require('../../../sites/demo'),
  {
    isContentComponent,
    urlToUri
  } = require('../../universal/utils'),
  { DEFAULT_STATION } = require('../../universal/constants'),
  rdcRoutes = rdcRouteObjs.map(obj => pathToRegexp(obj.path)),
  // these are a hardcoded version of amphora v7.5.2 lib/routes.js line 21
  //   also '_users' added.  There may be more but we can add them when
  //   issues arise.
  clayReservedRoutes = [
    '/_components',
    '/_layouts',
    '/_lists',
    '/_pages',
    '/_uris',
    '/_users'
  ],
  rdcSlug = DEFAULT_STATION.site_slug,
  /**
   * a helper method which assigns uninitialized station slug properties in the
   *   to the slug which was found.
   *
   * this method mutates results
   *
   * @param {string} foundStationSlug
   * @param {object} stationSlugObj
   * @param {string} stationSlugObj.forCommonUse
   * @param {string} stationSlugObj.forPermissions
   */
  initBothSlugsTo = (foundStationSlug, stationSlugObj) => {
    // only set the properties which haven't been already
    if (typeof stationSlugObj.forCommonUse !== 'string') {
      stationSlugObj.forCommonUse = foundStationSlug;
    }
    if (typeof stationSlugObj.forPermissions !== 'string') {
      stationSlugObj.forPermissions = foundStationSlug;
    }
  },
  /**
   * Logs the error if something happened besides the result not being found
   *
   * @param {string} uri
   * @param {Error} err
   */
  logUnexpectedDbError = (uri, err) => {
    if (err.name !== 'NotFoundError') {
      log('error', 'Error getting the data from uri: ' + uri, err);
    }
  },
  /**
   * fetches the main component from the page associated with the uri, and
   *   returns its 'stationSlug' property or the rdc slug
   *
   * @param {string} uri - note this is a clay _uri i.e. an id of the 'uris' table
   * @returns {string}
   */
  getStationSlugFromUri = async uri => {
    try {
      const pageUri = await db.get(uri),
        pageData = await db.get(pageUri),
        mainComponentData = await db.get(pageData.main[0]);

      return mainComponentData.stationSlug || rdcSlug;
    } catch (err) {
      logUnexpectedDbError(uri, err);
    }

    // if the uri, page or main component doesn't exist then there's not much
    //   we can do other than return the default station slug
    return rdcSlug;
  },
  /**
   * fetches the main component's data in the page and returns the 'stationSlug'
   *   property or the rdc slug.  If the page wasn't found or it didn't contain
   *   main content 'null' is returned to indicate a station couldn't
   *   be determined.
   *
   * @param {string} uri - the page uri
   * @returns {string}
   */
  getStationSlugFromPage = async uri => {
    let mainComponentUri;

    try {
      mainComponentUri = _get(await db.get(uri), 'main[0]', rdcSlug);
    } catch (err) {
      logUnexpectedDbError(uri, err);
    }

    return mainComponentUri
      ? getStationSlugFromComponent(mainComponentUri)
      : null;
  },
  /**
   * fetches the component data and returns the 'stationSlug' property or the
   *   rdc slug.  If the component isn't found or an error occurrs fetching the
   *   component we return 'null' to indicate a station couldn't be determined.
   *
   * @param {string} uri
   * @returns {string|null}
   */
  getStationSlugFromComponent = async uri => {
    try {
      return _get(await db.get(uri), 'stationSlug', rdcSlug);
    } catch (err) {
      logUnexpectedDbError(uri, err);
      return null;
    }
  },
  /**
   * returns the potential slug of the site via the first element of the path
   *
   * @param {object} req
   * @return {string}
   */
  getPotentialStationSlugFromReq = req => {
    const stationPath = req.originalUrl.split('/')[1];

    return stationPath;
  },
  /**
   * returns whether the request
   *   1. is not a reserved route
   *   2. matches a route defined in demo/index.js
   *
   * @param {string} pathToTest - the pathname of the original url
   * @returns {boolean}
   */
  isRdcRoute = pathToTest => {
    return clayReservedRoutes.every(reservedRoute => !pathToTest.startsWith(reservedRoute))
      && rdcRoutes.some(routeRe => routeRe.test(pathToTest));
  },
  /**
   * see './index.js -> checkUntilSlugsAreFound' for how this object is used
   */
  getSlugFrom = {
    /**
     * if the request url has a station slug in it, then assign it to the results
     *   object appropriately
     *
     * @param {object} stationSlugObj
     * @param {object} pipelineArgs
     * @param {object} pipelineArgs.allStations
     * @param {object} pipelineArgs.req
     */
    requestUrl: (stationSlugObj, { allStations, req }) => {
      const slugInReqUrl = getPotentialStationSlugFromReq(req);

      if (allStations.bySlug[slugInReqUrl]) {
        initBothSlugsTo(slugInReqUrl, stationSlugObj);
      }
    },
    /**
     * if the request url has a station id parameter then assign the station's
     *   slug to the results.
     *
     * note this doesn't assign to permissions because that would allow any user
     *   to edit content they shouldn't be allowed to do
     *
     * @param {object} stationSlugObj
     * @param {string} stationSlugObj.forCommonUse
     * @param {object} pipelineArgs
     * @param {object} pipelineArgs.req
     * @param {object} pipelineArgs.allStations
     */
    stationIdParameter: (stationSlugObj, { req, allStations }) => {
      const { stationId } = req.query;

      if (
        allStations.byId[stationId]
        && typeof stationSlugObj.forCommonUse !== 'string'
      ) {
        stationSlugObj.forCommonUse = allStations.byId[stationId].site_slug;
      }
    },
    /**
     * if the request url is a page uri, then return the slug from that page's
     *   main content component
     *
     * @param {object} stationSlugObj
     * @param {object} pipelineArgs
     * @param {string} pipelineArgs.url
     */
    pageUri: async (stationSlugObj, { url }) => {
      if (!isPage(url)) {
        return;
      }

      if (url.endsWith('/meta')) {
        url = url.slice(0, -'/meta'.length);
      }

      const foundStationSlug = await getStationSlugFromPage(urlToUri(url));

      if (typeof foundStationSlug === 'string') {
        initBothSlugsTo(foundStationSlug, stationSlugObj);
      }
    },
    /**
     * if the request url is a content component then return its stationSlug
     *
     * @param {object} stationSlugObj
     * @param {object} pipelineArgs
     * @param {string} pipelineArgs.url
     */
    contentComponent: async (stationSlugObj, { url }) => {
      if (!isContentComponent(url)) {
        return;
      }

      const foundStationSlug = await getStationSlugFromComponent(urlToUri(url));

      if (typeof foundStationSlug === 'string') {
        initBothSlugsTo(foundStationSlug, stationSlugObj);
      }
    },
    /**
     * if the request url is for a published uri (exists in the 'uris' table)
     *   then return the station slug associated with its page's main component
     *
     * @param {object} stationSlugObj
     * @param {object} pipelineArgs
     * @param {string} pipelineArgs.url
     */
    publishedUri: async (stationSlugObj, { url }) => {
      if (!isUri(url)) {
        return;
      }

      const foundStationSlug = await getStationSlugFromUri(url);

      if (typeof foundStationSlug === 'string') {
        initBothSlugsTo(foundStationSlug, stationSlugObj);
      }
    },
    /**
     * if the request url matches a route defined in demo/index.js then set the
     *   slug to the default station
     *
     * @param {object} stationSlugObj
     * @param {object} pipelineArgs
     * @param {string} pipelineArgs.url
     */
    rdcRoute: async (stationSlugObj, { url }) => {
      if (isRdcRoute(urlParse(url).pathname)) {
        initBothSlugsTo(rdcSlug, stationSlugObj);
      }
    }
  };

module.exports = getSlugFrom;