'use strict';

const axios = require('axios'),
  /**
   * Upload a file directly to s3 using a pre-signed request url.
   *
   * File object: https://developer.mozilla.org/en-US/docs/Web/API/File
   *
   * @param {string} s3SignedUrl - The signed url used as temporary aws creds to process the direct s3 upload.
   * @param {File} file - File object associated with file upload input button.
   * @param {string} s3FileType - MIME type of file.
   *
   * @returns {Promise}
   */
  execFileUpload = (s3SignedUrl, file, s3FileType) => {
    return axios.put(s3SignedUrl, file, {
      headers: {
        'Content-Type': s3FileType
      }
    });
  },
  /**
   * Send file name and mime type to backend so backend can use AWS creds to generate aws pre-signed request url
   * associated with this file. This signed url will act as temporary AWS credentials that
   * the client will use to directly upload the file to s3.
   *
   * @param {string} fileName - filename of attached file.
   * @param {string} fileType - MIME type of attached file.
   *
   * @returns {Promise}
   */
  prepareFileForUpload = (fileName, fileType) => {
    return axios.post('/advanced-image-upload', {
      fileName: fileName,
      fileType: fileType
    }).then(result => result.data);
  },
  /**
   * Send file name and type to backend so backend can generate aws pre-signed request url.
   * This allows us to keep our aws secret on the backend, while still uploading directly
   * from the client to s3. Actual s3 file key (aka file name) will be built on backend by processing
   * attached filename and appending a UUID to ensure there are no file collisions in the s3 bucket.
   *
   * @param {object} file
   * @param {string} file.name
   * @param {string} file.type
   *
   * @returns {Promise}
   */
  uploadFile = (file) => {
    return prepareFileForUpload(file.name, file.type)
      .then(data => {
        return execFileUpload(data.s3SignedUrl, file, data.s3FileType)
          .then(() => ({ host: data.s3CdnHost, fileKey: data.s3FileKey }));
      });
  };

module.exports.uploadFile = uploadFile;
