'use strict';

const { textToEncodedSlug } = require('./utils'),
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
});
