'use strict';

var expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename);

describe(dirname, function () {
  describe(filename, function () {

    describe('save', function () {
      const method = lib[this.title],
        mockLocals = { site: { slug: 'wwwthecut' } };

      it('should the video id without extra parameters in the query string', function () {
        method('some_ref', {videoId: 'bpOSxM0rNPM&t=97'}, mockLocals)
          .then(data => {
            expect(data.videoId).to.eql('bpOSxM0rNPM');
          });
      });

      it('should set playerBorderTop, playerBorderBottom and previousTypeRelated to true if previousTypeRelated is false and videoType is Related', function () {
        const data = method('some_ref', { previousTypeRelated: false, videoType: 'Related' }, mockLocals);

        expect(data.playerBorderTop).to.be.true;
        expect(data.playerBorderBottom).to.be.true;
        expect(data.previousTypeRelated).to.be.true;
      });

      it('should set playerBorderTop, playerBorderBottom and previousTypeRelated to false if videoType is not Related and previousTypeRelated is true', function () {
        const data = method('some_ref', {previousTypeRelated: true, videoType: 'Sponsored'}, mockLocals);

        expect(data.playerBorderTop).to.be.false;
        expect(data.playerBorderBottom).to.be.false;
        expect(data.previousTypeRelated).to.be.false;
      });

      it('should set autoPlay and autoPlayNextVideo to false if videoType is Sponsored and previousTypeRelated is true', function () {
        const data = method('some_ref', {videoType: 'Sponsored'}, mockLocals);

        expect(data.autoPlay).to.be.false;
        expect(data.autoPlayNextVideo).to.be.false;
      });

      it('should set playlist based on site if not set', () => {
        method('some_ref', {videoId: 'bpOSxM0rNPM'}, mockLocals)
          .then(data => {
            expect(data.videoPlaylist).to.eql('PL4B448958847DA6FB');
          });
      });
    });

  });
});
