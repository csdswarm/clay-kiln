'use strict';

const { join } = require('path'),
  { lstatSync, readdirSync } = require('fs'),
  { isComponent, isPage } = require('clayutils'),
  _get = require('lodash/get'),
  { DEFAULT_STATION } = require('../../universal/constants'),
  getSlugFrom = require('./get-slug-from'),
  { getFullOriginalUrl, isContentComponent } = require('../../universal/utils'),
  isDirectory = source => lstatSync(source).isDirectory(),
  getDirectories = source => {
    // @TODO: find a better way to validate this public folder or faking the function
    try {
      return readdirSync(source).map(name => join(source, name)).filter(isDirectory);
    } catch (e) {
      console.log('Warning, directory not found');
      return [];
    }
  },
  publicDirs = getDirectories('./public/').map(dir => dir.replace('public', '')),
  rdcSlug = DEFAULT_STATION.site_slug,
  /**
   * determines if the path is valid for station information
   * invalid paths are as follows:
   *  Paths to files (has extension)
   *  Paths to non-content components that do not include a stationId query
   *
   * @param {object} req
   * @return {boolean}
   */
  validPath = req => {
    // the extra parens are for readability
    // eslint-disable-next-line no-extra-parens
    const stationsList = (
      (
        isComponent(req.path)
        && !isContentComponent(req.path)
        && !req.query.stationId
      )
      || false
    );

    return !stationsList
      && publicDirs.every(publicPathDir => !req.path.startsWith(publicPathDir));
  },
  /**
   * takes a pipeline of functions which are sequentially called with
   *   stationSlugObj and pipelineArgs.  This stops when both stationSlugObj
   *   'forCommonUse' and 'forPermissions' are strings (an empty string
   *   indicates the national station).  Each function in the pipeline must
   *   mutate the stationSlugObj if its condition applies.
   *
   * stationSlugObj has the schema
   * {
   *   forCommonUse: {string}
   *   forPermissions: {string}
   * }
   *
   * @param {object} pipelineArgs
   * @param {function[]} pipeline
   * @returns {object}
   */
  getStationSlugs = async (pipelineArgs, pipeline) => {
    const stationSlugObj = {
      // see the comment above `assignStationsToLocals` for an explanation on
      //   these properties
      forCommonUse: null,
      forPermissions: null
    };

    for (const getSlugFn of pipeline) {
      await getSlugFn(stationSlugObj, pipelineArgs);

      if (
        typeof stationSlugObj.forCommonUse === 'string'
        && typeof stationSlugObj.forPermissions === 'string'
      ) {
        break;
      }
    }

    return stationSlugObj;
  },
  /**
   * assigns the station for common use throughout our app, and the station for
   *   permissions.  They need to be separate because:
   *
   *   1. the 'default' station is applied differently
   *   2. the station for common use needs to be able to be modified via the
   *      'stationId' query parameter
   *
   * @param {object} locals
   * @param {object} req
   * @param {object} res
   * @param {object} allStations
   * @return {object}
   */
  assignStationsToLocals = async (locals, req, res, allStations) => {
    if (!validPath(req)) {
      Object.assign(locals, {
        station: {},
        stationForPermissions: null

      });
      return;
    }

    const url = getFullOriginalUrl(req),
      pipelineArgs = { allStations, req, url },
      stationSlug = await getStationSlugs(
        pipelineArgs,
        [
          getSlugFrom.requestUrl,
          getSlugFrom.stationIdParameter,
          getSlugFrom.pageUri,
          getSlugFrom.contentComponent,
          getSlugFrom.publishedUri,
          getSlugFrom.rdcRoute,
          getSlugFrom.cookie
        ]
      ),
      // this ternary accounts for the unlikely scenario 'null' is a
      //   station slug
      station = stationSlug.forCommonUse
        ? _get(allStations, `bySlug[${stationSlug.forCommonUse}]`, DEFAULT_STATION)
        : DEFAULT_STATION,
      { forPermissions: permissionSlug } = stationSlug;

    let stationForPermissions = null;

    if (isPage(url) && typeof permissionSlug === 'string') {
      res.cookie('station', permissionSlug, { sameSite: 'strict' });
    }

    if (permissionSlug === rdcSlug) {
      stationForPermissions = DEFAULT_STATION;
    } else if (permissionSlug) {
      stationForPermissions = allStations.bySlug[permissionSlug];
    }

    Object.assign(locals, {
      // for common use
      station,
      stationForPermissions
    });
  };

module.exports = assignStationsToLocals;
