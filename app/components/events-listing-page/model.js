'use strict';

const { assignStationInfo } = require('../../services/universal/create-content.js'),
  queryService = require('../../services/server/query'),
  elasticIndex = 'published-content',
  elasticFields = [
    'headline',
    'startDate',
    'startTime',
    'venueName',
    'venueAddress',
    'feedImgUrl',
  ],
  maxItems = 10,
  pageLength = 5,
  protocol = `${process.env.CLAY_SITE_PROTOCOL}:`,
  utils = require('../../services/universal/utils'),
  { urlToElasticSearch } = utils;

/**
 * Gets recent events data from elastic
 *
 * @param {Object} locals
 * @returns {Promise<{
 *  url: string, 
 *  headline: string,
 *  startDate: Date,
 *  startTime: Date,
 *  venueName: string,
 *  venueAddress: string,
 *  feedImgUrl: string,
 * }[]>}
 */
async function getRecentEventsFromElastic(locals) {
  // TODO
}

/**
 * Gets event data from elastic by querying with event url
 *
 * @param {String[]} urlsList
 * @param {Object} locals
 * @returns {Promise<{
 *  url: string, 
 *  headline: string,
 *  startDate: Date,
 *  startTime: Date,
 *  venueName: string,
 *  venueAddress: string,
 *  feedImgUrl: string,
 * }[]>}
 */
async function getEventDataFromElastic(urlsList, locals) {
  return await Promise.all(urlsList.map(async (url) => {
    const query = queryService.newQueryWithCount(elasticIndex, 1, locals),
      canonicalUrl = utils.urlToCanonicalUrl(
        urlToElasticSearch(url)
      );
 
    queryService.addFilter(query, { term: { canonicalUrl } });
    queryService.addFilter(query, { term: { contentType: 'event' } });
    if (locals.station.callsign !== locals.defaultStation.callsign) {
      queryService.addMust(query, { match: { station: locals.station } });
    }
    queryService.onlyWithTheseFields(query, elasticFields);
    return queryService.searchByQuery(query)
      .then(function (result) {
        return {
          ...result,
          url: url.replace(/^http:/, protocol)
        };
      })
      .catch(e => {
        queryService.logCatch(e, url);
        return url;
      });
  }));
}

module.exports.save = async (uri, data, locals) => {
  assignStationInfo(uri, data, locals);

  const curatedEvents = await getEventDataFromElastic(data.curatedEvents, locals),
    recentEvents = await getRecentEventsFromElastic(locals);

  data.lede = (await getEventDataFromElastic([data.ledeUrl]))[0];
  data.events.push(curatedEvents, recentEvents);

  // TODO: LOAD MORE & LAZY LOADING
  
  return data;
};
