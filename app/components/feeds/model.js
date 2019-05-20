'use strict';

const queryService = require('../../services/server/query'),
  bluebird = require('bluebird'),
  log = require('../../services/universal/log').setup({
    file: __filename,
    component: 'feeds'
  });

/**
 * Make sure you have an index, transform and meta property on the
 * data
 * @param  {String} uri
 * @param  {Object} data
 * @return {Promise|Object}
 */
module.exports.save = function (uri, data) {
  const { meta } = data;

  if (!data.index || !meta) {
    return bluebird.reject(new Error('Feeds component requires an `index` and `meta` property'));
  }

  if (!meta.renderer) {
    return bluebird.reject(new Error('A feed needs to specify which renderer to use'));
  }

  if (!meta.contentType) {
    return bluebird.reject(new Error('A feed needs to indicate the `Content-Type` a component\'s final data will be served in'));
  }

  if (!meta.fileExtension) {
    return bluebird.reject(new Error('A feed needs a `fileExtension` property to indicate the file type of the scraped feed'));
  }

  return data;
};


/**
 * This render function's pure function is to execute
 * an Elastic query stored in the data.
 *
 * @param  {String} ref
 * @param  {Object} data
 * @param  {Object} locals
 * @return {Promise|Object}
 */
module.exports.render = async (ref, data, locals) => {
  if (!data.index) {
    log('error', 'Feed component requires an `index` and `transform` property in the data');
    return data;
  }

  // If the query param `skipQuery` is present, don't query.
  // Handy for only fetching metadata
  if (locals && locals.skipQuery) {
    return data;
  }

  const { meta } = data,
    filters = locals.query.filter || {},
    excludes = locals.query.exclude || {},
    query = queryService(data.index, data.query.query ? data.query.query : null), // Build the appropriate query obj for the env
    /**
     * add a condition to the query
     *
     * @param {String} item - a string of items to apply add to the query condition
     * @param {Function} createObj - a function that take the value and returns the object representation
     * @param {String} condition  - possible options addShould/addMust/addMustNot
     */
    addCondition = (item, createObj, condition) => {
      if (item) {
        const items = item.split(',');

        items.forEach(instance => queryService[condition](query, { match: createObj(instance)}));
        if (condition === 'addShould') {
          queryService.addMinimumShould(query, 1);
        }
      }
    },
    /**
     * add filter and exclude conditions to the query
     *
     * @param {String} key
     * @param {Function} createObj
     */
    addFilterAndExclude = (key, createObj) => {
      addCondition(filters[key], createObj, 'addShould');
      addCondition(excludes[key], createObj, 'addMustNot');
    },
    genericItems = {
      // vertical (sectionfront) and/or exclude tags
      vertical: sectionFront => ({ sectionFront }),
      // tags
      tag: tag => ({ 'tags.normalized': tag }),
      // subcategory (secondary article type)
      subcategory: secondaryArticleType => ({ secondaryArticleType }),
      // editorial feed (grouped stations)
      editorial: editorial => ({ [`editorialFeeds.${editorial}`]: true })
    };

  queryService.addSize(query, filters.size ? filters.size : data.query.size);
  queryService.addSort(query, data.query.sort);
  if (data.query._source) {
    queryService.onlyWithTheseFields(query, data.query._source);
  }
console.log('filters',filters)
console.log('excludes',excludes)

  // Loop through all the generic items and add any filter/exclude conditions that are needed
  Object.entries(genericItems).forEach(([key, createObj]) => addFilterAndExclude(key, createObj))

  // special case logic filter/excludes
  // stations (nested object search)
  if (filters.station) {
    const nestedQuery = queryService.newNestedQuery('byline'),
      stations = filters.station.split(',');

    stations.forEach(station => queryService.addShould(nestedQuery, { match: { 'byline.sources.text': station }}));
    queryService.addMinimumShould(nestedQuery, 1);

    queryService.addMust(query, nestedQuery);
  }
  if (excludes.station) {
    const nestedQuery = queryService.newNestedQuery('byline'),
      stations = excludes.station.split(',');

    stations.forEach(station => queryService.addMustNot(nestedQuery, { match: { 'byline.sources.text': station }}));

    queryService.addMust(query, nestedQuery);
  }

console.log(JSON.stringify(query))
  try {
    if (meta.rawQuery) {
      const results = await queryService.searchByQueryWithRawResult(query);

      data.results = results.hits.hits; // Attach results and return data
      return data;
    } else {
      data.results = await queryService.searchByQuery(query); // Attach results and return data

      return data;
    }
  } catch (e) {
    console.log(e)
    queryService.logCatch(e, 'feeds.model');
    return data;
  }

};


//{
// 	"_index": "published-content_v4",
// 	"_type": "_doc",
// 	"_id": "clay.radio.com/_components/article/instances/cjvs8rp5e000r1gp4hgact2tz@published",
// 	"_score": 1,
// 	"_source": {
// 		"primaryHeadline": "syndication",
// 		"headline": "syndication",
// 		"subHeadline": "",
// 		"feedImgUrl": "https://stg-images.radio.com/aiu-media/Brien-06c86d93-0db0-41cc-ac2c-55f2e812ce36.png",
// 		"feedLayout": "small",
// 		"teaser": "asd",
// 		"slug": "asd",
// 		"byline": [{
// 			"names": [],
// 			"sources": [],
// 			"prefix": "by"
// 		}],
// 		"syndicatedUrl": "",
// 		"syndicationStatus": "original",
// 		"lead": [
// 			"clay.radio.com/_components/html-embed/instances/cjvs8xazc000z3h5yqbo4ilvx@published"
// 		],
// 		"content": [{
// 			"data": "{\"text\":\"\"}",
// 			"_ref": "clay.radio.com/_components/paragraph/instances/cjvs8rp5e000q1gp4dwgtayb9@published"
// 		}],
// 		"tags": [],
// 		"sideShare": {
// 			"_ref": "clay.radio.com/_components/share/instances/cjvs8rp5d000o1gp4n5filzzb@published"
// 		},
// 		"feeds": {
// 			"sitemaps": true,
// 			"rss": true,
// 			"most-popular": true,
// 			"newsfeed": true,
// 			"apple-news": true
// 		},
// 		"sectionFront": "news",
// 		"secondaryArticleType": "Politics",
// 		"contentType": "article",
// 		"showSocial": true,
// 		"dateModified": "2019-05-17T16:49:20.046Z",
// 		"authors": [],
// 		"sources": [],
// 		"contentPageSponsorLogo": {
// 			"_ref": "clay.radio.com/_components/google-ad-manager/instances/cjvs8rp5d000p1gp4e46reebl@published"
// 		},
// 		"_version": 3,
// 		"breadcrumbs": [{
// 				"text": "news",
// 				"url": "//clay.radio.com/news"
// 			},
// 			{
// 				"text": "Politics",
// 				"url": "//clay.radio.com/news/politics"
// 			}
// 		],
// 		"stationLogoUrl": "",
// 		"stationURL": "",
// 		"canBeMarkedGoogleStandout": true,
// 		"availableStandoutArticleInventory": true,
// 		"articleWithinGoogleStandoutPublishDateLimit": true,
// 		"rollingStandoutCount": 0,
// 		"componentVariation": "article",
// 		"empty": "<span class=\"circulation--empty\">None</span>",
// 		"featured": false,
// 		"editorialFeeds": {
// 			"Sports": true,
// 			"Country": false,
// 			"Classic Rock": true,
// 			"CHR / Top 40": true,
// 			"Hot AC / Top 40 / CHR": true
// 		},
// 		"shortHeadline": "asd",
// 		"seoHeadline": "asd",
// 		"seoDescription": "ads",
// 		"pageTitle": "asd",
// 		"plaintextPrimaryHeadline": "syndication",
// 		"plaintextShortHeadline": "asd",
// 		"pageDescription": "ads",
// 		"socialDescription": "asd",
// 		"date": "2019-05-17T15:37:39.465+00:00",
// 		"canonicalUrl": "http://clay.radio.com/news/asd",
// 		"slugLock": true,
// 		"manualSlugUnlock": false,
// 		"site": "demo",
// 		"pageUri": "clay.radio.com/_pages/cjvs8rp50000e1gp4lqn2dylo@published"
// 	}
// }
