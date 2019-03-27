'use strict';
const queryService = require('../../services/server/query'),
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


      queryService.addMinimumShould(query, 1);

      if (contentTypes.length) {
        queryService.addFilter(query, {terms: {contentType: contentTypes}});
      }

      // exclude the current page in results
      if (locals.url && !isComponent(locals.url)) {
        cleanUrl = locals.url.split('?')[0].replace('https://', 'http://');
        queryService.addMustNot(query, {match: {canonicalUrl: cleanUrl}});
      }

      // exclude the curated content from the results
      if (data.items && !isComponent(locals.url)) {
        data.items.forEach(item => {
          if (item.canonicalUrl) {
            cleanUrl = item.canonicalUrl.split('?')[0].replace('https://', 'http://');
            queryService.addMustNot(query, {match: {canonicalUrl: cleanUrl}});
          }
        });
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
      const hydrationResults = await queryService.searchByQuery(query);

      data.articles = data.items.concat(hydrationResults.slice(0, maxItems)).slice(0, maxItems); // show a maximum of maxItems links

      return data;
    } catch (e) {
      queryService.logCatch(e, ref);
      return data;
    }
  },
  /**
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  renderStation = async (data, locals) => {
    const response = await radioApiService.get('stations', { filter: { slug: locals.params.dynamicStation } }),
      feedUrl = `${response.data[0].attributes.website}/station_feed.json`,
      feed = await radioApiService.get(feedUrl, null, (response) => response.nodes),
      nodes = feed.nodes ? feed.nodes.filter((item) => item.node).slice(0, 5) : [],
      defaultImage = 'http://images.radio.com/aiu-media/og_775x515_0.jpg';

    data.station = response.data[0].attributes.name;
    data.articles = await Promise.all(nodes.map(async (item) => {
      return {
        feedImgUrl: item.node['OG Image'] ? await uploadImage(item.node['OG Image'].src) : defaultImage,
        externalUrl: item.node.URL,
        primaryHeadline: item.node.field_engagement_title
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
    const result = await recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields);

    return  {
      ...item,
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
module.exports.render = function (ref, data, locals) {
  if (data.populateBy === 'station' && locals.params) {
    return renderStation(data, locals);
  }

  if (data.populateBy === 'tag' && data.tag && locals) {
    const query = queryService.newQueryWithCount(elasticIndex, maxItems);

    // Clean based on tags and grab first as we only ever pass 1
    data.tag = tag.clean([{text: data.tag}])[0].text || '';
    queryService.addShould(query, { match: { 'tags.normalized': data.tag }});

    return renderDefault(ref, data, locals, query);
  }

  if (data.populateBy === 'sectionFront' && data.sectionFront && locals) {
    const query = queryService.newQueryWithCount(elasticIndex, maxItems);

    queryService.addShould(query, { match: { sectionFront: data.sectionFront }});

    return renderDefault(ref, data, locals, query);
  }

  return Promise.resolve(data);
};
