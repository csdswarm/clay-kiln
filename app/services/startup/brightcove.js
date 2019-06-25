'use strict';

const brightcoveApi = require('../universal/brightcoveApi'),
  _get = require('lodash/get'),
  moment = require('moment'),
  /**
   *  Create a query string that works with brightcove api standards
   *
   * @param {object} params includes query, endDate, and startDate
   * @returns {string} a brightcove friendly query string
   */
  buildQuery = (params) => {
    const {query, endDate, startDate} = params,
      start = startDate ? moment(startDate).startOf('day').toISOString() : '',
      end = endDate ? moment(endDate).endOf('day').toISOString() : 'NOW',
      updatedAtQuery = startDate || endDate ? `%20%2Bupdated_at:${start}..${end}` : '';

    return `${encodeURIComponent(query)}${updatedAtQuery}`;
  },
  /**
   * Return only the needed fields to the UI
   *
   * @param {Array} results array of video objects
   * @returns {Array} an array of video objects with only needed fields
   */
  transformSearchResults = (results) => (results || []).map(({name, images, id, updated_at}) => {
    return {name, id, imageUrl: _get(images, 'thumbnail.src', ''), updated_at};
  }),
  /**
   * Returns an array of Brightcove videos based on the provided query
   *
   * @param {object} req
   * @param {object} res
   * @returns {Promise}
   */
  search = async (req, res) => {
    try {
      return brightcoveApi.request('GET', 'videos', {q: buildQuery(req.query), limit: 10})
        .then(transformSearchResults)
        .then(results => res.send(results))
        .catch(e => {
          console.error(e);
          res.send(e);
        });
    } catch (e) {
      console.error(e);
      res.send(e);
    }
  },
  /**
   * There are four API requests involved in push-based ingestion for videos:
   * CMS API POST request to create the video object in Video Cloud (same as for pull-based ingestion)
   * Dynamic Ingest GET request to get the Brightcove S3 bucket URLs
   * PUT request to upload the source file to the Brightcove S3 bucket
   * Dynamic Ingest POST request to ingest the source file (same as for pull-based ingestion)
   *
   * @param {object} req
   * @param {object} res
   * @returns {Promise}
   */
  upload = async (req, res) => {
    console.log("REQUEST");
    const {
      name,
      shortDescription: description,
      longDescription: long_description,
      station,
      highLevelCategory: high_level_category,
      secondaryCategory,
      tertiaryCategory,
      additionalKeywords: vmg_category
    } = req.body,
      mandatoryCategories = tertiaryCategory ? `${ secondaryCategory },${ tertiaryCategory }` : secondaryCategory;
    console.log({
      name,
      description,
      long_description,
      custom_fields: {
        station,
        high_level_category,
        vmg_category: `${ mandatoryCategories },${ vmg_category }`
      }
    });

    try {
      const createdVideo = await brightcoveApi.request('POST', 'videos', null, {
        name,
        description,
        long_description,
        custom_fields: {
          station,
          high_level_category,
          vmg_category: `${ mandatoryCategories },${ vmg_category }`
        },
        economics: 'AD_SUPPORTED'
      });

      console.log(createdVideo);
      if (createdVideo) {
        // next steps
      }
    } catch (e) {
      console.error(e);
      res.send(e);
    }
  },
  getVideoByID = async (req, res) => {
    try {
      const video = await brightcoveApi.request('GET', `videos/${req.query.id}`)

      if (video.id) {
        res.send(video);
      }
      res.send(`Error fetching video with ID ${req.query.id}`);
    } catch (e) {
      console.error(e);
      res.send(e);
    }
  },
  /**
   * Add Brightcove routes to the express app
   *
   * @param {object} app the express app
   */
  inject = (app) => {
    app.use('/brightcove/search', search);
    app.use('/brightcove/upload', upload);
    app.use('/brightcove/get', getVideoByID);
  };

module.exports.inject = inject;
