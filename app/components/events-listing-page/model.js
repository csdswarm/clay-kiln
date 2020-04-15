'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  { assignStationInfo } = require('../../services/universal/create-content.js'),
  queryService = require('../../services/server/query'),
  elasticIndex = 'published-content',
  elasticFields = [
    'headline',
    'startDate',
    'startTime',
    'venueName',
    'venueAddress',
    'feedImgUrl',
    'canonicalUrl'
  ],
  maxItems = 10,
  pageLength = 5,
  protocol = `${process.env.CLAY_SITE_PROTOCOL}:`,
  { isComponent } = require('clayutils'),
  utils = require('../../services/universal/utils'),
  { urlToElasticSearch } = utils;

/**
 * Gets recent events data from elastic
 *
 * @param {string} uri
 * @param {Object} data
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
async function getRecentEventsFromElastic(uri, data, locals) {
  const query = queryService.newQueryWithCount(elasticIndex, maxItems + 1, locals);

  queryService.addFilter(query, { term: { contentType: 'event' } });
  if (locals.station.callsign !== locals.defaultStation.callsign) {
    queryService.addMust(query, { match: { station: locals.station } });
  }
  queryService.onlyWithTheseFields(query, elasticFields);
  queryService.addSort(query, { date: 'desc' });

  // exclude the curated content from the results
  if (data.curatedEvents && !isComponent(locals.url)) {
    data.curatedEvents.forEach(url => {
      const cleanUrl = utils.urlToCanonicalUrl(
        urlToElasticSearch(url)
      );

      queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
    });
  }

  data.initialLoad = false;

  if (locals && locals.page) {
    /* after the first 10 items, show N more at a time (pageLength defaults to 5)
     * page = 1 would show items 10-15, page = 2 would show 15-20, page = 0 would show 1-10
     * we return N + 1 items so we can let the frontend know if we have more data.
     */
    if (!data.pageLength) {
      data.pageLength = pageLength;
    }

    const skip = maxItems + (parseInt(locals.page) - 1) * data.pageLength;

    queryService.addOffset(query, skip);
  } else {
    data.pageLength = maxItems;
    data.initialLoad = true;

    // Default to loading 30 articles, which usually works out to 4 pages
    data.lazyLoads = Math.max(Math.ceil((30 - data.pageLength) / data.pageLength), 0);
  }

  return queryService.searchByQuery(query)
    .then(function (result) {
      return {
        ...result,
        url: result.canonicalUrl.replace(/^http:/, protocol)
      };
    })
    .catch(e => {
      queryService.logCatch(e, uri);
      return [];
    });
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

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    const curatedEvents = await getEventDataFromElastic(data.curatedEvents, locals),
      recentEvents = await getRecentEventsFromElastic(uri, data, locals);

    data.lede = (await getEventDataFromElastic([data.ledeUrl]))[0];

    // "load more" button passes page query param - render more content and return it
    data.moreContent = recentEvents.length > data.pageLength;

    // On initial load we need to append curated items onto the list, otherwise skip
    // Show a maximum of pageLength links
    if (data.initialLoad) {
      data.events.push(curatedEvents, recentEvents);
      data.events = data.events.slice(0, data.pageLength);
    } else {
      data.events = recentEvents.slice(0, data.pageLength);
    }

    return data;
  },
  save: (uri, data, locals) => {
    assignStationInfo(uri, data, locals);

    return data;
  }
});
