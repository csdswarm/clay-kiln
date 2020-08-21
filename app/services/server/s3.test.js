'use strict';
process.env.AWS_S3_CDN_HOST = 'images.radio.com';
process.env.AWS_S3_BUCKET = 'radioimg';

const expect = require('chai').expect,
  fetchMock = require('fetch-mock'),
  lib = require('./s3'),
  sinon = require('sinon'),
  AWS = require('aws-sdk'),
  sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('server', () => {
  const imageName = 'image.png',
    imageBody = 'imageBody',
    imagePath = `aiu-media/${imageName}`,
    imageUrl = `http://my.domain/${imageName}`,
    radioImageUrl = `https://images.radio.com/${imagePath}`;

  describe('s3', () => {
    afterEach(() => {
      sinon.restore();
      fetchMock.restore();
    });

    // TODO: Fix.
    //   This seems to run fine in webstorm, but not from command line. Determine diff and fix
    describe.skip('uploadImage', () => {

      it('will return the image when it exists', async () => {
        const __ = lib._internals;

        sinon.stub(AWS, 'S3').returns({
          headObject: (option, func) => func({ code: 'exists' })
        });

        __.s3 = new AWS.S3();

        const result = await lib.uploadImage(imageUrl);

        expect(result).to.eql(radioImageUrl);
      });

      it('will async upload the image when it does not exists and return the original image', async () => {
        let headOptions = null,
          uploadOptions = null;
        const
          __ = lib._internals,
          promise = sinon.stub(),
          s3 = {
            headObject: async (option, func) => {
              headOptions = option;
              return await func({ code: 'NotFound' });
            },
            upload: (option) => {
              uploadOptions = option;
              return { promise };
            }
          };

        sinon.stub(AWS, 'S3').returns(s3);
        __.s3 = new AWS.S3();

        fetchMock.mock(imageUrl, { body: imageBody });
        fetchMock.mock(radioImageUrl, 200);

        // eslint-disable-next-line one-var
        const result = await lib.uploadImage(imageUrl);

        expect(result).to.eql(imageUrl);

        // since the upload is async, just sleep for a little to ensure eveything runs
        await sleep(500);

        expect(promise.callCount).to.eql(1);
        expect(headOptions.Key).to.eql(imagePath);
        expect(uploadOptions.Key).to.eql(imagePath);
        expect(uploadOptions.Body).to.eql(imageBody);
        expect(fetchMock.calls(imageUrl).length).to.eql(1);
        expect(fetchMock.calls(radioImageUrl).length).to.eql(1);
        expect(fetchMock.calls(radioImageUrl)[0][1].method).to.eql('PURGE');
      });
    });
  });
});
