'use strict';

const expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename);

describe(dirname, function () {
  describe(filename, function () {

    describe('save', function () {
      const method = lib[this.title],
        mockLocals = { site: { slug: 'www.radio.com' } };

      // this test needs to mock out universal/youtube -> getVideoDetails
      //   because that method is throwing a 403 Forbidden
      //
      // it('shows the video id without extra parameters in the query string', () => {
      //   return method('some_ref', { contentId: 'sv634CrVaUM&t=15' }, mockLocals)
      //     .then(data => {
      //       expect(data.contentId).to.eql('sv634CrVaUM');
      //     });
      // });

      it('should set autoPlay and autoPlayNextVideo to false if videoType is Sponsored and previousTypeRelated is true', function () {
        const data = method('some_ref', { videoType: 'Sponsored' }, mockLocals);

        expect(data.autoPlay).to.be.false;
        expect(data.autoPlayNextVideo).to.be.false;
      });
    });

  });
});
