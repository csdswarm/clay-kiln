'use strict';

var expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename);

describe(dirname, function () {
  describe(filename, function () {
    describe('save', function () {
      const fn = lib[this.title],
        uri = 'http://foo.com/_components/svg/instances/bar';

      it ('removes any non-svg html from "content"', function () {
        const mockData = {
            svgContent: '<div>Some stuff</div><html><head></head></html><body></body>'
          },
          expectedResult = {
            svgContent: ''
          };

        expect(fn(uri, mockData)).to.deep.equal(expectedResult);
      });

      it ('keeps svg content', function () {
        const mockData = {
            svgContent: '<script></script><svg><path d="M0 0l1 1"/></svg>'
          },
          expectedResult = {
            svgContent: '<svg><path d="M0 0l1 1"></path></svg>'
          };

        expect(fn(uri, mockData)).to.deep.equal(expectedResult);
      });

      it ('keeps only the first svg element', function () {
        const mockData = {
            svgContent: '<svg id="1"></svg><svg id="2"></svg>'
          },
          expectedResult = {
            svgContent: '<svg id="1"></svg>'
          };

        expect(fn(uri, mockData)).to.deep.equal(expectedResult);
      });

      it ('sanitizes to protect against xss attacks', function () {
        const mockData = {
            svgContent: '<svg><g/onload=alert(2)//<p>'
          },
          expectedResult = {
            svgContent: '<svg><g></g></svg>'
          };

        expect(fn(uri, mockData)).to.deep.equal(expectedResult);
      });
    });
  });
});
