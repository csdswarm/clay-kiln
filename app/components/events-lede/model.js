'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
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
  utils = require('../../services/universal/utils'),
  { urlToElasticSearch } = utils,
  { assignStationInfo } = require('../../services/universal/create-content.js');

function getFormattedDate(date, time) {
  return date && time ? moment(`${date} ${time}`).format('LLLL') : '';
}

/**
 * Gets event data from elastic by querying with event url
 *
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
async function getEventDataFromElastic(data, locals) {
  const query = queryService.newQueryWithCount(elasticIndex, 1, locals),
    canonicalUrl = utils.urlToCanonicalUrl(
      urlToElasticSearch(data.ledeUrl)
    );

  queryService.addFilter(query, { term: { canonicalUrl } });
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
        url: data.ledeUrl.replace(/^http:/, protocol)
      };
    })
    .catch(e => {
      queryService.logCatch(e, data.ledeUrl);
      return { url: data.ledeUrl };
    });
}

module.exports = unityComponent({
  render: (uri, data) => {
    const lede = {
      dateTime: getFormattedDate(data.lede.startDate, data.lede.startTime),
      addressLink: `https://www.google.com/maps/dir//${ data.lede.venueAddress }`
    };

    data._computed = { lede };

    return data;
  },
  save: async (uri, data, locals) => {
    if (!locals || !locals.defaultStation) {
      return data;
    }

    assignStationInfo(uri, data, locals);
    data.lede = await getEventDataFromElastic(data, locals);

    return data;
  }
});
