/**
 *
 * Proprietary routing logic.
 *
 */

'use strict';

// Require Dependencies
const AWS = require('aws-sdk'),
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1'
  }),
  uuidv4 = require('uuid/v4'),
  additionalDataTypes = require('../services/server/add-data-types'),
  radioApi = require('../services/server/radioApi'),
  brightcoveApi = require('../services/universal/brightcoveApi'),
  addEndpoints = require('./add-endpoints'),
  ensureStationOnCustomUrl = require('./ensure-station-on-custom-url'),
  siteMapStations = require('./sitemap-stations'),
  siteMapGoogleNews = require('./sitemap-google-news'),
  stationTheming = require('../services/server/stationThemingApi');

module.exports = router => {
  // Auth Middleware
  // Add this middleware to a route if the route requires authentication.
  function checkAuth(req, res, next) {
    if (!req.isAuthenticated()) {
      return res.status(403).send('Forbidden.');
    } else {
      return next();
    }
  }

  addEndpoints.refreshPermissions(router, checkAuth);

  /**
   *
   * Advanced Image Upload
   *
   * This endpoint accepts a file name and mime type and uses that to generate
   * a unique file key that preserves the SEO value of the original filename while
   * allowing safe upload to s3.
   *
   * This endpoint also uses AWS credentials to create a pre-signed url that can be
   * used by the frontend to directly upload the file to s3.
   *
   */
  router.post('/advanced-image-upload', checkAuth, function (req, res) {

    // Set env vars
    const s3Bucket = process.env.AWS_S3_BUCKET,
      s3CdnHost = process.env.AWS_S3_CDN_HOST || `${process.env.AWS_S3_BUCKET}.s3.amazonaws.com`; // If no CDN set, fallback to raw s3 host.
    let extension;

    // Validate input
    if (
      !req.body.fileName
      || !/\.(jpg|jpeg|gif|png|JPG|JPEG|GIF|PNG)$/.test(req.body.fileName) // File name must include valid extension.
      || !req.body.fileType
      || !['image/jpeg', 'image/png', 'image/gif'].includes(req.body.fileType) // Only allow jpeg/png/gif images.
    ) {
      return res.status(400).json({
        code: 400,
        data: null,
        error: new Error('Invalid input.')
      });
    }

    // Sanitize/process filename and add UUID to ensure file is unique within s3 bucket.
    const rawFileNameParts = req.body.fileName.split('.');

    rawFileNameParts.pop();
    const rawFileName = rawFileNameParts.join('.'),
      processedFilename = rawFileName.replace(/[^A-Za-z0-9\s]/gi, '').replace(/[\s]/gi, '-');

    // Determine extension
    switch (req.body.fileType) { // eslint-disable-line default-case
      case 'image/jpeg':
        extension = 'jpg';
        break;
      case 'image/png':
        extension = 'png';
        break;
      case 'image/gif':
        extension = 'gif';
    }

    // Build s3 file key
    const newFileName = `${processedFilename}-${uuidv4()}.${extension}`,
      s3FileKey = `aiu-media/${newFileName}`,
      // Create pre-signed s3 upload url and respond.
      params = {
        Bucket: s3Bucket,
        Key: s3FileKey,
        Expires: 60,
        ContentType: req.body.fileType
      };

    s3.getSignedUrl('putObject', params, function (err, signedUrl) {
      if (err) {
        return res.status(500).json({
          code: 500,
          data: null,
          error: new Error('Error generating signature.')
        });
      } else {
        return res.json({
          s3Bucket: s3Bucket,
          s3FileKey: s3FileKey,
          s3FileType: req.body.fileType,
          s3SignedUrl: signedUrl,
          s3CdnHost: s3CdnHost
        });
      }
    });
  });

  /**
   * Caching for api.radio.com endpoints
   */
  router.get('/api/v1/*', function (req, res) {
    radioApi.get(req.params[0], req.query, null, {}, res.locals).then(function (data) {
      return res.send(data);
    });
  });

  /**
   * Proxy for brightcove api endpoints
   */
  router.get('/api/brightcove', function (req, res) {
    brightcoveApi.get(req.query).then(function ({ status, statusText, body: data }) {
      if (status === 200) {
        return res.send(data);
      } else {
        return res.status(500).send(statusText);
      }
    });
  });

  addEndpoints.importContent(router);
  addEndpoints.sitemap(router);

  /**
   * Sitemap for stations directories and station detail pages
   */
  router.get('/sitemap-stations.xml', siteMapStations);

  /**
   * Sitemap for articles for google news
   */
  router.get('/sitemap-google-news.xml', siteMapGoogleNews);

  additionalDataTypes.inject(router, checkAuth);
  stationTheming.inject(router, checkAuth);
  addEndpoints.alerts(router);
  addEndpoints.createPage(router);
  addEndpoints.imageInfo(router, checkAuth);
  ensureStationOnCustomUrl(router);
  addEndpoints.validSource(router);
};
