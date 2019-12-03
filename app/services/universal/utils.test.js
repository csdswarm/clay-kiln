'use strict';
const {
    listDeepObjects,
    textToEncodedSlug
  } = require('./utils'),
  { expect } = require('chai');

describe('Universal Utils', () => {
  describe('textToEncodedSlug', () => {
    it('trims excess whitespace', () => {
      expect(textToEncodedSlug('  test   ')).to.eql('test');
    });

    it('lower cases normal text', () => {
      expect(textToEncodedSlug('Something')).to.eql('something');
    });

    it('replaces spaces with hyphens', () => {
      expect(textToEncodedSlug('some text')).to.eql('some-text');
    });

    it('url encodes the text', () => {
      expect(textToEncodedSlug('stuff&things|stuff/things'))
        .to.eql('stuff%26things%7Cstuff%2Fthings');
    });

    it('trims, lowercases, hyphenates and encodes', () => {
      const text = '  Text & Stuff, Things/Whatchamacallits, and résumé builders  ',
        expected = 'text-%26-stuff%2C-things%2Fwhatchamacallits%2C-and-r%C3%A9sum%C3%A9-builders';

      expect(textToEncodedSlug(text)).to.eql(expected);
    });

  });

  // The following was copied nearly verbatim from node_modules/amphora/lib/services/references.test.js
  describe('listDeepObjects', function () {
    const fn = listDeepObjects;

    it('listDeepObjects gets all deep objects', function () {
      const result = fn({ a:{ b:{ c:{ d:'e' } }, f:{ g:{ h:'e' } } } });

      expect(result).to.have.length(5);
    });

    it('listDeepObjects can filter by existence of properties', function () {
      const result = fn({ a:{ b:{ c:{ d:'e' } }, f:{ d:{ g:'e' } } } }, 'd');

      expect(result).to.have.length(2);
    });

    it('listDeepObjects can filter by component', function () {
      const result = fn({ a: { type:'yarn' }, b: { c: { type:'sweater' } } }, function (obj) { return !!obj.type; });

      expect(result).to.deep.equal([
        { type:'yarn' },
        { type:'sweater' }
      ]);
    });
  });
});
