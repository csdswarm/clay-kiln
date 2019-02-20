'use strict';

const AWS = require('aws-sdk'),
  path = require('path'),
  url = require('url'),
  imageHost = 'https://images.radio.com/',
  directory = 'aiu-media/';

/**
 * Upload an image to images.radio.com
 *
 * @param {string} imgUrl
 * @returns {Promise}
 */
module.exports.uploadImage = async (imgUrl) => {
  const s3 = new AWS.S3(),
    image = path.basename(url.parse(imgUrl).pathname),
    newImgUrl = `${imageHost}${directory}${image}`,
    s3Options = {
      Bucket: 'radioimg',
      Key   : `${directory}${decodeURI(image)}`
    };

  return await new Promise(async (resolve) => {
    // headObject checks if a file exists
    s3.headObject(s3Options, async (err) => {
      if (err && err.code === 'NotFound') {
        // return the original location instead of waiting for the image to be uploaded so users don't wait
        resolve(imgUrl);

        // Get image
        const response = await fetch(imgUrl);

        s3Options.Body = response.body;
        // upload file
        await s3.upload(s3Options).promise();
        // Send a purge request for Fastly asyc
        await fetch(newImgUrl, { method: 'PURGE' });
      } else {
        // image exists already
        resolve(newImgUrl);
      }
    });
  });
};
