'use strict';

const
  { unityComponent } = require('../../services/universal/amphora'),
  bluebird = require('bluebird'),
  moment = require('moment'),
  queryService = require('../../services/server/query'),
  elasticIndex = 'published-content',
  elasticFields = [
    'itemId',
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
  { urlToElasticSearch } = utils,
  { assignStationInfo } = require('../../services/universal/create-content.js');

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

  queryService.addMust(query, { match: { canonicalUrl } });
  queryService.addFilter(query, { term: { contentType: 'event' } });
  if (data.stationSlug) {
    queryService.addMust(query, { match: { stationSlug: data.stationSlug } });
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
  if (data.stationSlug) {
    queryService.addMust(query, { match: { stationSlug: data.stationSlug } });
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

  if (locals && locals.page) {
    /* after the first 10 items, show N more at a time (pageLength defaults to 5)
    * page = 1 would show items 10-15, page = 2 would show 15-20, page = 0 would show 1-10
    * we return N + 1 items so we can let the frontend know if we have more data.
    */

    /**
     * need to offset by 1 so we don't load the last item from
     * previous load
     */
    const offset = 1,
      skip = offset
        + data.numberToDisplay
        + (parseInt(locals.page) - 1) * data.loadMoreAmount;

    queryService.addOffset(query, skip);
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

    assignStationInfo(uri, data, locals);

    // setup curated events
    data.curatedEventsData = await bluebird.map(
      data.curatedEvents,
      async event => {
        return await getEventDataFromElastic(event, data, locals);
      },
      { concurrency: 10 }
    );

    return data;
  },
  render: async (uri, data, locals) => {
    const curatedEvents = data.curatedEventsData || [],
      recentEvents = await getRecentEventsFromElastic(uri, data, locals),
      events = curatedEvents.concat(recentEvents).slice(0, data.numberToDisplay),
      prepareEvent = event => {
        return {
          ...event,
          dateTime: event.startDate ? moment(`${event.startDate} ${event.startTime}`).format('LLLL') : 'none'
        };
      };

    data._computed.events = events.map(prepareEvent);
    // load more functionality
    // if there is a page number include more events with the page num as offset
    if (locals.page) {
      const moreEvents =  await getRecentEventsFromElastic(uri, data, locals);

      data._computed.moreEvents = moreEvents.map(prepareEvent);
    }
    return data;
  }
});
