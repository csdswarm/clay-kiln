'use strict';
const {
    replaceWithString
  } = require('./sanitize'),
  { expect } = require('chai');

describe('Universal Utils', () => {
  describe('replaceWithString', () => {
    it('replace string based on provided strings array to desired string', () => {
      expect(replaceWithString('This is a radio.com test', ['radio', 'RADIO'], 'RADIO')).to.eql('This is a RADIO.com test');
    });

    it('replace all the occurrences of the pattern provided with the desired string', () => {
      expect(replaceWithString('This is a radio radio radio radio.com test', [/(radio)/g], 'RADIO')).to.eql('This is a RADIO RADIO RADIO RADIO.com test');
    });

    it('replace only the first occurrence of the pattern provided with the desired string', () => {
      expect(replaceWithString('This is a radio radio radio radio.com test', [/(radio)/], 'RADIO')).to.eql('This is a RADIO radio radio radio.com test');
    });

    it('throws an error indicating that the original string is not valid or null', () => {
      expect(() => replaceWithString(null, [/(radio)/], 'RADIO')).to.throw('Empty or null string');
      expect(() => replaceWithString(undefined, [/(radio)/], 'RADIO')).to.throw('Empty or null string');
      expect(() => replaceWithString(1, [/(radio)/], 'RADIO')).to.throw('Empty or null string');
    });

    it('throws an error indicating that the pattern array or replace string are not valid', () => {
      expect(() => replaceWithString('This is a string', null, null)).to.throw('Invalid Pattern Array or replaceString');
      expect(() => replaceWithString('This is a string', [/(radio)/], null)).to.throw('Invalid Pattern Array or replaceString');
      expect(() => replaceWithString('This is a string', [/(radio)/], 1)).to.throw('Invalid Pattern Array or replaceString');
    });


  });
});
