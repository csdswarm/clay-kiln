'use strict';

var expect = require('chai').expect,
  sinon = require('sinon'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename),
  rest = require('../../services/universal/rest'),
  videos = require('../../services/universal/video-embeds');

describe(dirname, function () {
  describe(filename, function () {
    describe('render', function () {
      const fn = lib[this.title],
        uri = 'domain.com/_components/video/instances/a';

      it('handles data missing the url property', function () {
        expect(fn(uri, {}, {})).to.eql({youtubeId: ''});
      });

      it('handles a non-youtube url', function () {
        const url = 'www.embed.westia.com/a/b/c';

        expect(fn(uri, {url}, {})).to.eql({url, youtubeId: ''});
      });

      it('handles youtube short url', function () {
        const url = 'https://youtu.be/ziipowS_kzY';

        expect(fn(uri, {url}, {})).to.eql({url, youtubeId: 'ziipowS_kzY'});
      });

      it('handles long form youtube urls', function () {
        const url = 'https://www.youtube.com/watch?v=ziipowS_kzY';

        expect(fn(uri, {url}, {})).to.eql({url, youtubeId: 'ziipowS_kzY'});
      });
    });

    describe('save', function () {
      var fn = lib[this.title],
        uri = 'domain.com/_components/foo',
        sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(rest, 'get');
        sandbox.stub(videos);
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('parses embed codes for urls', function () {
        rest.get.returns(Promise.resolve({ html: '' }));
        return fn(uri, { url: '<iframe src="sup"></iframe>' }).then(function (result) {
          expect(result.url).to.equal('sup');
        });
      });

      it('sanitizes url', function () {
        rest.get.returns(Promise.resolve({ html: '' }));
        return fn(uri, { url: 'sup</a>' }).then(function (result) {
          expect(result.url).to.equal('sup');
        });
      });

      it('uses custom youtube embed', function () {
        videos.youtube.returns('');
        return fn(uri, { url: 'http://youtube.com/v/foo' }).then(function () {
          expect(videos.youtube.called).to.equal(true);
        });
      });

      it('uses custom magnify embed', function () {
        videos.magnify.returns('');
        return fn(uri, { url: 'http://videos.nymag.com/foo' }).then(function () {
          expect(videos.magnify.called).to.equal(true);
        });
      });

      it('sets the video to invalid if trying to parse a non-video embed', function () {
        // note: it throws the error before the promise
        return fn(uri, { url: 'http://twitter.com/foo' }).then(function (result) {
          expect(result.videoValid).to.equal(false);
        });
      });

      it('sets the video to invalid if the embedly request throws an error', function () {
        rest.get.returns(Promise.reject());
        return fn(uri, { url: 'http://vimeo.com/video-not-found' }).then(function (result) {
          expect(result.videoValid).to.equal(false);
        });
      });

      it('attempts to embed via embedly', function () {
        rest.get.returns(Promise.resolve({ html: 'foo' }));
        return fn(uri, { url: 'http://vimeo.com/foo' }).then(function () {
          expect(rest.get.called).to.equal(true);
        });
      });

      it('removes width and height from embedly iframe', function () {
        rest.get.returns(Promise.resolve({ html: '<iframe class="embedly-embed" src="//cdn.embedly.com/widgets/foo" width="500" height="281" scrolling="no" frameborder="0" allowfullscreen></iframe>' }));
        return fn(uri, { url: 'http://vimeo.com/foo' }).then(function (result) {
          expect(result.html.indexOf('width="500"')).to.equal(-1);
          expect(result.html.indexOf('height="281"')).to.equal(-1);
        });
      });

      it('falls back to bare iframe if embedly does not return html', function () {
        rest.get.returns(Promise.resolve({}));
        return fn(uri, { url: 'http://vimeo.com/foo' }).then(function (result) {
          expect(result.html).to.equal(undefined);
        });
      });

      it('does not generate new html if lastGenerated is set and equals saved url', function () {
        rest.get.returns(Promise.resolve({}));
        return fn(uri, {url: 'http://vimeo.com/foo', lastGenerated: 'http://vimeo.com/foo', html: 'foo' }).then(function (result) {
          expect(rest.get.called).to.be.false;
          expect(result.html).to.equal('foo');
        });
      });

      it('does generate new html if lastGenerated is set and does NOT equal saved url', function () {
        rest.get.returns(Promise.resolve({}));
        return fn(uri, {url: 'http://vimeo.com/foo', lastGenerated: 'http://vimeo.com/bar', html: 'foo' }).then(function (result) {
          expect(rest.get.called).to.be.true;
          expect(result.html).to.not.equal('foo');
        });
      });

      it('removes lastGenerated if url is unset', function () {
        return fn(uri, {url: '', lastGenerated: 'http://foo.com', html: 'bar'}).then(function (result) {
          expect(result.lastGenerated).to.equal('');
        });
      });

    });
  });
});
