'use strict';

const expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename);

describe(dirname, function () {
  describe(filename, function () {
    describe('render', function () {
      const fn = lib[this.title],
        ref = 'uri.com/_components/clay-typekit/instances/ref';

      it('sets no kitId when there is no kitSrc', function () {
        expect(fn(ref, {}, {})).to.eql({});
      });

      it('sets no kitId when the kitSrc is empty', function () {
        expect(fn(ref, {kitSrc: ''}, {})).to.eql({kitSrc: ''});
      });

      it('sets no kitId when the kitSrc does not have a matching pattern', function () {
        expect(fn(ref, {kitSrc: 'http://www.google.com'}, {})).to.eql({kitSrc: 'http://www.google.com'});
      });

      it('sets  kitId when the kitSrc has a parseable pattern', function () {
        expect(fn(ref, {kitSrc: 'http://www.google.com/123abc.js'}, {})).to.eql({kitSrc: 'http://www.google.com/123abc.js', kitId: '123abc'});
      });
    });
  });
});
