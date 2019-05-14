'use strict';

const expect = require('chai').expect,
  fetchMock = require('fetch-mock'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename),
  sinon = require('sinon'),
  AWS = require('aws-sdk'),
  sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe(dirname, () => {
  let sandbox;
  const imageName = 'image.png',
    imageBody = 'imageBody',
    imagePath = `aiu-media/${imageName}`,
    imageUrl = `http://my.domain/${imageName}`,
    radioImageUrl = `https://images.radio.com/${imagePath}`;

  describe(filename, () => {
    beforeEach(() => {
      sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
      sandbox.restore();
      fetchMock.restore();
    });

    describe('upload', () => {

      it('will return the image when it exists', async () => {
        sandbox.stub(AWS, 'S3').returns({
          headObject: (option, func) => func({ code: 'exists' })
        });

        const result = await lib.uploadImage(imageUrl);

        expect(result).to.eql(radioImageUrl);
      });

      it('will async upload the image when it does not exists and return the original image', async () => {
        let headOptions = null,
          uploadOptions = null;
        const promise = sinon.stub(),
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

        sandbox.stub(AWS, 'S3').returns(s3);
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
