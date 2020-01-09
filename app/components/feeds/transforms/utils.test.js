/* eslint-disable max-nested-callbacks */
'use strict';

const expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename);

describe('feeds', () => {
  describe(dirname, () => {
    describe(filename, () => {
      const componentList = [
        {
          ref: 'domain/_components/foo-component/instances/some-instance@published',
          data: '{"foo": "bar"}'
        },
        {
          ref: 'domain/_components/baz-component/instances/another-instance@published',
          data: '{"bar": "baz"}'
        }
      ];

      describe('getMimeType', () => {
        const fn = lib.getMimeType;

        it('finds the MIME type when a url is provided', () => {
          const url = 'http://pixel.nymag.com/imgs/daily/science/2017/03/15/15-pug-artist.w710.h473.jpg';

          return expect(fn(url)).to.eql('image/jpeg');
        });
      });

      describe('addArrayOfProps', () => {
        const fn = lib.addArrayOfProps,
          data = ['foo', 'bar', 'baz'];

        it('maps values to objects having a specified prop and add those objects to an array', () => {
          const array = [],
            property = 'buzz';

          fn(data, property, array);

          return array.map((item, index) => expect(item[property]).to.eql(data[index]))
            .every(result => result === true);
        });
      });

      describe('filterAndParse', () => {
        const fn = lib.filterAndParse;

        it('filters a component list by a component name then parses the matches data attribute', () => {
          const filterAndParsed = fn(componentList, 'foo-component');

          return expect(filterAndParsed).to.have.lengthOf(1) &&
            expect(filterAndParsed[0].foo).to.eql('bar');
        });
      });

      describe('firstAndParse', () => {
        const fn = lib.firstAndParse;

        it('find first of a component in a component list and parses its data', () => {
          const firstAndParsed = fn(componentList, 'foo-component');

          return expect(firstAndParsed.foo).to.eql('bar');
        });
      });

      describe('parseComponentData', () => {
        const fn = lib.parseComponentData;

        it('parses a component data in string format to js object', () => {
          const component = componentList[0],
            parsedComponent = fn(component);

          return expect(parsedComponent).to.be.a('object') &&
            expect(parsedComponent.foo).to.be.eql('bar');
        });
      });
    });
  });
});
