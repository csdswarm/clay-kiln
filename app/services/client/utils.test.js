'use strict';

const
  { utils } = require('./utils'),
  { expect } = require('chai');

describe('Client Utils', () => {
  describe('Truncate', () => {

    const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque interdum urna non orci rhoncus lobortis. Curabitur sed vulputate ante. Mauris felis lacus, feugiat nec rutrum quis, mattis ac urna.';

    it('should truncate string to 11 chars with no suffix', () => {
      expect(utils.truncate(lorem, 11)).to.eql('Lorem ipsum');
    });
    it('should truncate string to 5 chars with suffix "..."', () => {
      expect(utils.truncate(lorem, 5, { useSuffix: true })).to.eql('Lorem...');
    });
    it('should truncate string to 5 chars with suffix " $$$"', () => {
      expect(utils.truncate(lorem, 5, { useSuffix: true, suffix: ' $$$' })).to.eql('Lorem $$$');
    });
  });

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
