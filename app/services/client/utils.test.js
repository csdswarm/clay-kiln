'use strict';

const
  { utils } = require('./utils'),
  { expect } = require('chai');

describe('Client Utils', () => {
  describe('Strip HTML', () => {
    it('should replace HTML in string with ""', () => {
      expect(utils.stripHtml('<p>stuffs</p>')).to.eql('stuffs');
    });
    it('should replace HTML in string with ###', () => {
      expect(utils.stripHtml('<p>stuffs</p>', '###')).to.eql('###stuffs###');
    });
    it('should leave non HTML as is', () => {
      expect(utils.stripHtml('more stuffs')).to.eql('more stuffs');
    });
  });
});
