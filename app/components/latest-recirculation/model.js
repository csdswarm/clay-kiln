'use strict';
const queryService = require('../../services/server/query'),
  loadedIdsService = require('../../services/server/loaded-ids'),
  db = require('../../services/server/db'),
  contentTypeService = require('../../services/universal/content-type'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  radioApiService = require('../../services/server/radioApi'),
  { uploadImage } = require('../../services/universal/s3'),
  { isComponent } = require('clayutils'),
  tag = require('../tags/model.js'),
  elasticIndex = 'published-content',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType'
  ],
  maxItems = 5,
  /**
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @param {object} query
   * @returns {Promise}
   */
  renderDefault = async (ref, data, locals, query) => {
    const
      trendingRecircRef = `${locals.site.host}/_components/trending-recirculation/instances/default@published`,
      contentTypes = contentTypeService.parseFromData(data);
    let cleanUrl, trendingRecircItems;

    try {
      // Get array of trending recirculation items from db, default to empty array.
      try {
        const trendingRecircData = await db.get(trendingRecircRef);

        trendingRecircItems = trendingRecircData.items;
      } catch (e) {
        if (e.message === `Key not found in database [${trendingRecircRef}]`) {
          trendingRecircItems = [];
        } else {
          throw e;
        }
      }

      queryService.onlyWithinThisSite(query, locals.site);
      queryService.onlyWithTheseFields(query, elasticFields);

      queryService.addSort(query, {date: 'desc'});

      if (contentTypes.length) {
        queryService.addFilter(query, {terms: {contentType: contentTypes}});
      }

      // exclude the current page in results
      if (locals.url && !isComponent(locals.url)) {
        cleanUrl = locals.url.split('?')[0].replace('https://', 'http://');
        queryService.addMustNot(query, {match: {canonicalUrl: cleanUrl}});
      }

      // exclude trending recirculation content from the results.
      if (trendingRecircItems.length && !isComponent(locals.url)) {
        trendingRecircItems.forEach(item => {
          if (item.canonicalUrl) {
            cleanUrl = item.canonicalUrl.split('?')[0].replace('https://', 'http://');
            queryService.addMustNot(query, {match: {canonicalUrl: cleanUrl}});
          }
        });
      }

      // hydrate item list.
      const hydrationResults = await queryService.searchByQuery(query, locals, { shouldDedupeContent: true });

      data.articles = data.items.concat(hydrationResults);
    } catch (e) {
      queryService.logCatch(e, ref);
    }

    return data;
  },
  /**
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  renderStation = async (data, locals) => {
    const feedUrl = `${locals.station.website}/station_feed.json`,
      feed = await radioApiService.get(feedUrl, null, (response) => response.nodes),
      nodes = feed.nodes ? feed.nodes.filter((item) => item.node).slice(0, 5) : [],
      defaultImage = 'https://images.radio.com/aiu-media/og_775x515_0.jpg';

    data.station = locals.station.name;
    data.articles = await Promise.all(nodes.map(async (item) => {
      return {
        feedImgUrl: item.node['OG Image'] ? await uploadImage(item.node['OG Image'].src) : defaultImage,
        externalUrl: item.node.URL,
        primaryHeadline: item.node.field_engagement_title || item.node.title
      };
    }));

    return data;
  };

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.save = async (ref, data, locals) => {
  if (!data.items.length || !locals) {
    return data;
  }

  data.items = await Promise.all(data.items.map(async (item) => {
    item.urlIsValid = item.ignoreValidation ? 'ignore' : null;

    const searchOpts = {
        includeIdInResult: true,
        shouldDedupeContent: false
      },
      result = await recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields, searchOpts);

    return  {
      ...item,
      uri: result._id,
      primaryHeadline: item.overrideTitle || result.primaryHeadline,
      pageUri: result.pageUri,
      urlIsValid: result.urlIsValid,
      canonicalUrl: item.url || result.canonicalUrl,
      feedImgUrl: item.overrideImage || result.feedImgUrl
    };
  }));

  return data;
};

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = async function (ref, data, locals) {
  if (data.populateBy === 'station' && locals.params) {
    return renderStation(data, locals);
  }

  const curatedIds = data.items.filter(item => item.uri).map(item => item.uri),
    availableSlots = maxItems - data.items.length;

  await loadedIdsService.appendToLocalsAndRedis(curatedIds, locals);

  // if there are no available slots then there's no need to query
  if (availableSlots <= 0) {
    return data;
  }

  if (data.populateBy === 'tag' && data.tag && locals) {
    const query = queryService.newQueryWithCount(elasticIndex, availableSlots);

    // Clean based on tags and grab first as we only ever pass 1
    data.tag = tag.clean([{text: data.tag}])[0].text || '';
    queryService.addMust(query, { match: { 'tags.normalized': data.tag }});

    return renderDefault(ref, data, locals, query);
  }

  if (data.populateBy === 'sectionFront' && data.sectionFront && locals) {
    const query = queryService.newQueryWithCount(elasticIndex, availableSlots);

    queryService.addMust(query, { match: { sectionFront: data.sectionFront }});
    return renderDefault(ref, data, locals, query);
  }

  return data;
};
