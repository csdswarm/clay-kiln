'use strict';

var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  expect = require('chai').expect,
  lib = require('./component-list-length');

describe(dirname, function () {
  describe(filename, function () {
    describe('validate', function () {
      var fn = lib[this.title];

      it('doesn\'t do anything if there\'s no gallery on the page', function () {
        var state = {
          components: {
            'www.url.com/_components/some-other-component/instances/a': { a: 'b' }
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('doesn\'t do anything if gallery has the right amount of images', function () {
        var state = {
          components: {
            'www.url.com/_components/image-gallery/instances/a': { images: Array(10) }
          }
        };

        expect(fn(state)).to.eql([]);
      });

      it('returns error there aren\'t enough images', function () {
        var state = {
          components: {
            'www.url.com/_components/image-gallery/instances/a': { images: Array(4) }
          }
        };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/image-gallery/instances/a',
          location: 'Image Gallery',
          field: 'images',
          preview: 'Must have at least 5 items in the images list.'
        }]);
      });

      it('returns error there are too many images', function () {
        var state = {
          components: {
            'www.url.com/_components/image-gallery/instances/a': { images: Array(400) }
          }
        };

        expect(fn(state)).to.eql([{
          uri: 'www.url.com/_components/image-gallery/instances/a',
          location: 'Image Gallery',
          field: 'images',
          preview: 'The images field cannot exceed 300 items.'
        }]);
      });
    });
  });
});
