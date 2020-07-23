'use strict';

const
  path = require('path'),
  url = require('url'),
  AWS = require('aws-sdk'),
  imageHost = `https://${process.env.AWS_S3_CDN_HOST}/`,
  directory = 'aiu-media/',

  __ = {
    s3: new AWS.S3({ region: 'us-east-1' })
  };

/**
 * Upload an image to images.radio.com
 *
 * @param {string} imgUrl
 * @returns {Promise}
 */
async function uploadImage(imgUrl, { alternateFileName , noWait = true } = {} ) {
  const
    { s3 } = __,
    image = alternateFileName || path.basename(url.parse(imgUrl).pathname),
    newImgUrl = `${imageHost}${directory}${image}`,
    s3Options = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key   : `${directory}${decodeURI(image)}`
    };

  return await new Promise(async (resolve) => {
    // headObject checks if a file exists
    s3.headObject(s3Options, async (err) => {
      if (err && err.code === 'NotFound') {

        if (noWait) {
          // return the original location instead of waiting for the image to be uploaded so users don't wait
          resolve(imgUrl);
        }

        // Get image
        const response = await fetch(imgUrl, { redirect: 'follow', follow: 20 });

        s3Options.Body = response.body;
        // upload file
        await s3.upload(s3Options).promise();
        // Send a purge request for Fastly asyc
        await fetch(newImgUrl, { method: 'PURGE' });

        if (!noWait) {
          resolve(newImgUrl);
        }

      } else {
        // image exists already
        resolve(newImgUrl);
      }
    });
  });
}

module.exports = {
  _internals: __,
  uploadImage
};
