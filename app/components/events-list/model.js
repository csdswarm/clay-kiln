'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  bluebird = require('bluebird'),
  moment = require('moment'),
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
  protocol = `${process.env.CLAY_SITE_PROTOCOL}:`,
  { isComponent } = require('clayutils'),
  utils = require('../../services/universal/utils'),
  { urlToElasticSearch } = utils;

/**
 * Gets event data from elastic by querying with event url
 *
 * @param {Object} event
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
async function getEventDataFromElastic(event, data, locals) {
  const query = queryService.newQueryWithCount(elasticIndex, 1, locals),
    canonicalUrl = utils.urlToCanonicalUrl(
      urlToElasticSearch(event.url)
    );

  queryService.addFilter(query, { term: { canonicalUrl } });
  queryService.addFilter(query, { term: { contentType: 'event' } });
  if (data.station) {
    queryService.addMust(query, { match: { stationSlug: data.station.site_slug } });
  } else {
    queryService.addMustNot(query, { exists: { field: 'stationSlug' } });
  }
  queryService.onlyWithTheseFields(query, elasticFields);
  return queryService.searchByQuery(query)
    .then(function (result) {
      return {
        ...result[0],
        url: event.url.replace(/^http:/, protocol)
      };
    })
    .catch(e => {
      queryService.logCatch(e, event.url);
      return event;
    });
}

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

  const query = queryService.newQueryWithCount(elasticIndex, data.loadMoreAmount, locals);

  queryService.addFilter(query, { term: { contentType: 'event' } });
  if (data.station) {
    queryService.addMust(query, { match: { stationSlug: data.station.site_slug } });
  } else {
    queryService.addMustNot(query, { exists: { field: 'stationSlug' } });
  }

  queryService.onlyWithTheseFields(query, elasticFields);
  queryService.addSort(query, { startDate: 'desc' });

  // exclude the curated content from the results
  if (data.curatedEvents && !isComponent(locals.url)) {
    data.curatedEvents.forEach(event => {
      const cleanUrl = utils.urlToCanonicalUrl(
        urlToElasticSearch(event.url)
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

    const skip = data.numberToDisplay + (parseInt(locals.page) - 1) * data.loadMoreAmount;

    queryService.addOffset(query, skip);
  } else {
    data.initialLoad = true;

    // Default to loading 30 articles, which usually works out to 4 pages
    data.lazyLoads = Math.max(Math.ceil((30 - data.loadMoreAmount) / data.loadMoreAmount), 0);
  }
  return queryService.searchByQuery(query)
    .then(function (results) {
      return results.map(result => {
        return {
          ...result,
          url: result.canonicalUrl.replace(/^http:/, protocol)
        };
      });
    })
    .catch(e => {
      queryService.logCatch(e, uri);
      return [];
    });
}

module.exports = unityComponent({
  save: async (uri, data, locals) => {
    if (!locals || !locals.defaultStation) {
      return data;
    }

    data.station = locals.newPageStation;

    const curatedEvents = await bluebird.map(
        data.curatedEvents,
        async event => {
          return await getEventDataFromElastic(event, data, locals);
        },
        { concurrency: 10 }
      ),
      recentEvents = await getRecentEventsFromElastic(uri, data, locals);

    // On initial load we need to append curated items onto the list, otherwise skip
    // Show a maximum of pageLength links
    if (data.initialLoad) {
      data.events = curatedEvents.concat(recentEvents).slice(0, data.numberToDisplay);
    } else {
      data.events = recentEvents.slice(0, data.numberToDisplay);
    }
    return data;
  },
  render: async (uri, data, locals) => {
    data._computed.events = data.events.map(event => {
      return {
        ...event,
        dateTime: event.startDate ? moment(`${event.startDate} ${event.startTime}`).format('LLLL') : 'none'
      };
    });
    // load more functionality
    // if there is a page number include more events with the page num as offset
    if (locals.page) {
      const moreEvents =  await getRecentEventsFromElastic(uri, data, locals);

      data._computed.moreEvents = moreEvents.map( event => {
        return {
          ...event,
          dateTime: event.startDate ? moment(`${event.startDate} ${event.startTime}`).format('LLLL') : 'none'
        };
      });
    }
    return data;
  }
});
