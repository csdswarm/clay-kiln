'use strict';
const expect = require('chai').expect,
  sinon = require('sinon'),
  dirname = __dirname.split('/').pop(),
  rest = require('./../../services/universal/rest'),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename);

describe(dirname, function () {
  describe(filename, function () {
    describe('save', function () {
      const fn = lib[this.title],
        uri = 'domain.com/_components/foo';
      let sandbox;


      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(rest);
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('correctly parses an Imgur API response for a regular image', function (done) {
        const inData = {
            url: 'http://imgur.com/image/foo'
          },
          mockApiResponse = {
            data: {
              title: 'Test Title',
              id: 'foo',
              link: 'http://imgur.com/foo.gif'
            }
          },
          expectedOutData = {
            url: 'http://imgur.com/image/foo',
            id: 'foo',
            title: 'Test Title',
            img: 'http://imgur.com/foo.gif'
          };

        rest.get.withArgs('https://api.imgur.com/3/gallery/foo')
          .returns(Promise.resolve(mockApiResponse));
        fn(uri, inData)
          .then((outData)=>{
            expect(outData).to.deep.equal(expectedOutData);
            done();
          })
          .catch(done);
      });

      it('correctly parses an Imgur API response for a gallery', function (done) {
        const inData = {
            url: 'http://imgur.com/gallery/foo'
          },
          mockApiResponse = {
            data: {
              title: 'Test Title',
              id: 'foo',
              link: 'http://imgur.com/foo.gif'
            }
          },
          expectedOutData = {
            url: 'http://imgur.com/gallery/foo',
            id: 'foo',
            title: 'Test Title',
            img: 'http://imgur.com/foo.gif'
          };

        rest.get.withArgs('https://api.imgur.com/3/gallery/foo')
          .returns(Promise.resolve(mockApiResponse));
        fn(uri, inData)
          .then((outData) => {
            expect(outData).to.deep.equal(expectedOutData);
            done();
          })
          .catch(done);
      });

      it('correctly parses an Imgur API response for an album, setting "img" to first image in the album', function (done) {
        const inData = {
            url: 'http://imgur.com/a/foo'
          },
          mockApiResponse = {
            data: {
              title: 'Test Title',
              id: 'foo',
              link: 'http://imgur.com/foo.gif',
              images: [{
                link: 'http://imgur.com/first-image.gif'
              }]
            }
          },
          expectedOutData = {
            url: 'http://imgur.com/a/foo',
            id: 'a/foo',
            title: 'Test Title',
            img: 'http://imgur.com/first-image.gif'
          };

        rest.get.withArgs('https://api.imgur.com/3/album/foo')
          .returns(Promise.resolve(mockApiResponse));
        fn(uri, inData)
          .then((outData) => {
            expect(outData).to.deep.equal(expectedOutData);
            done();
          })
          .catch(done);
      });

      it('adds placeholder title if API response contains no title', function (done) {
        const inData = {
            url: 'http://imgur.com/gallery/foo'
          },
          mockApiResponse = {
            data: {
              id: 'foo',
              link: 'http://imgur.com/foo.gif'
            }
          },
          expectedOutData = {
            url: 'http://imgur.com/gallery/foo',
            id: 'foo',
            title: '<span class="imgur-empty">No Title</span>',
            img: 'http://imgur.com/foo.gif'
          };

        rest.get.withArgs('https://api.imgur.com/3/gallery/foo')
          .returns(Promise.resolve(mockApiResponse));
        fn(uri, inData)
          .then((outData) => {
            expect(outData).to.deep.equal(expectedOutData);
            done();
          })
          .catch(done);
      });

      it('rejects promise if API call fails', function (done) {
        const inData = {
          url: 'http://imgur.com/image/foo'
        };

        rest.get.returns(Promise.reject());
        fn(uri, inData)
          .then(() => {
            done('expected fnc to throw error');
          })
          .catch(() => done());
      });

    });
  });
});
