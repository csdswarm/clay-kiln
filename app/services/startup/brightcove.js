'use strict';

const brightcoveApi = require('../universal/brightcoveApi'),
  slugify = require('../universal/slugify'),
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
  transformVideoResults = (results) => (results || []).map(({name, images, id, updated_at}) => {
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
        .then(transformVideoResults)
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
   * Create new video object in brightcove and
   * gets the Brightcove S3 bucket URLs for video ingestion
   *
   * @param {object} req
   * @param {object} res
   * @returns {Promise}
   */
  create = async (req, res) => {
    const {
      videoName: name,
      shortDescription: description,
      longDescription: long_description,
      station,
      highLevelCategory: high_level_category,
      tags,
      adSupported: economics
    } = req.body;

    try {
      // Step 1: Create video object in video cloud
      const {name: createdVidName, id: createdVidID} = await brightcoveApi.request('POST', 'videos', null, {
        name,
        description,
        long_description,
        custom_fields: {
          station,
          high_level_category
        },
        tags,
        economics
      });

      if (createdVidName && createdVidID) {
        const sourceName = slugify(createdVidName),
          // Step 2: Request for Brightcove S3 Urls
          { signed_url, api_request_url } = await brightcoveApi.getS3Urls(createdVidID, sourceName);

        if (signed_url && api_request_url) {
          res.send({signed_url, api_request_url, videoID: createdVidID});
        } else {
          res.send('Failed to fetch brightcove S3 URLs.');
        }
      } else {
        res.send('Failed to create video object in Brightcove.');
      }
    } catch (e) {
      console.error(e);
      res.send(e);
    }
  },
  /**
   * Ingest newly uploaded video from Brightcove S3 bucket to
   * corresponding video object in Brightcove
   *
   * @param {object} req
   * @param {object} res
   * @returns {Promise}
   */
  upload = async (req, res) => {
    const {
      api_request_url,
      videoID
    } = req.body;

    try {
      const ingestResponse = await brightcoveApi.ingestVideoFromS3(videoID, api_request_url);

      if (ingestResponse.id) {
        const video = await brightcoveApi.request('GET', `videos/${videoID}`);

        if (video.id) {
          res.send({ video: transformVideoResults([video])[0], jobID: ingestResponse.id });
        } else {
          res.send('Failed to fetch created video.');
        }
      } else {
        res.send('Failed to ingest video file from S3.');
      }
    } catch (e) {
      console.error(e);
      res.send(e);
    }
  },
  /**
   * Get status of ingest job
   *
   * @param {object} req
   * @param {object} res
   * @returns {Promise}
   */
  getIngestStatus = async (req, res) => {
    const {
      videoID,
      jobID
    } = req.body;

    try {
      const ingestJobStatus = await brightcoveApi.getStatusOfIngestJob(videoID, jobID);

      if (ingestJobStatus === 'finished') {
        res.send(ingestJobStatus);
      } else {
        res.send(`Failed to ingest video file from S3. Job status: ${ingestJobStatus}`);
      }
    } catch (e) {
      console.error(e);
      res.send(e);
    }
  },
  /**
   * Update data for existing video in brightcove
   *
   * @param {object} req
   * @param {object} res
   * @returns {Promise}
   */
  update = async (req, res) => {
    const {
      video,
      videoName: name,
      shortDescription: description,
      longDescription: long_description,
      station,
      highLevelCategory: high_level_category,
      tags,
      adSupported: economics
    } = req.body;

    try {
      // Patch video object in video cloud
      const updateResponse = await brightcoveApi.request('PATCH', `videos/${video.id}`, null, {
        name,
        description,
        long_description,
        custom_fields: {
          station,
          high_level_category
        },
        tags,
        economics
      });

      if (updateResponse.id) {
        res.send(updateResponse);
      } else {
        res.send('Failed to update video object in Brightcove.');
      }
    } catch (e) {
      console.error(e);
      res.send(e);
    }
  },
  /**
   * Get video object from brightcove by ID
   * Returns full or transformed object
   *
   * @param {object} req
   * @param {object} res
   * @returns {Promise}
   */
  getVideoByID = async (req, res) => {
    try {
      const video = await brightcoveApi.request('GET', `videos/${req.query.id}`);

      if (video.id) {
        if (!req.query.full_object) {
          res.send(transformVideoResults([video])[0]);
        } else {
          res.send(video);
        }
      } else {
        res.send(`Error fetching video with ID ${req.query.id}`);
      }
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
    app.use('/brightcove/create', create);
    app.use('/brightcove/upload', upload);
    app.use('/brightcove/ingestStatus', getIngestStatus);
    app.use('/brightcove/update', update);
    app.use('/brightcove/get', getVideoByID);
  };

module.exports.inject = inject;
module.exports.transformVideoResults = transformVideoResults;
