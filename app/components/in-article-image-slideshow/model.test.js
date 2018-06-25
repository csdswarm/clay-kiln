'use strict';

var expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename);


describe(dirname, function () {
  describe(filename, function () {
    describe('save', function () {
      let fn = lib[this.title],
        uri = 'domain.com/_components/in-article-image-slideshow/instances/foo';


      it('renders per-instance styles', function () {
        return fn(uri, { sass: 'border:1px solid #000;' }).then(function (result) {
          expect(result).to.eql({ sass: 'border:1px solid #000;', css: `[data-uri="${uri}"]{border:1px solid #000}`});
        });
      });

      it('deletes css if sass is deleted', function () {
        expect(fn(uri, {sass: ''}).css).to.be.empty;
      });


    });
  });
});

